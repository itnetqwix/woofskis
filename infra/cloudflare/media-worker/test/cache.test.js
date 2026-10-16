import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import worker from '../src/index.js';
import { cacheKeyFor, responseForCache, STORED_STATUS_HEADER } from '../src/index.js';

const KEY =
  'contests/62d3e785-8c7b-40ce-ae01-a7a1ff011d3b/creators/add1f46b-5d58-4e59-a288-3b7a1c72db24/e09d433c-e922-45c8-91f7-a5f079c967b2.mov';
const MEDIA = `https://media.woofskis.com/v1/${KEY}`;
const SECRET = 'unit-test-secret-not-real';

const env = {
  AWS_ACCESS_KEY_ID: 'unit-test-access-key',
  AWS_SECRET_ACCESS_KEY: SECRET,
  AWS_REGION: 'us-east-2',
  S3_BUCKET: 'woofskis-production-media',
};

class MemoryCache {
  constructor() {
    this.entries = new Map();
    this.putStatuses = [];
  }

  async match(request) {
    const found = this.entries.get(request.url);
    return found ? found.clone() : undefined;
  }

  async put(request, response) {
    this.putStatuses.push(response.status);
    if (response.status !== 200) {
      throw new TypeError(`Response status ${response.status} is not supported`);
    }
    this.entries.set(request.url, response.clone());
  }
}

function install(originBehavior) {
  const cache = new MemoryCache();
  const calls = [];
  const pending = [];
  const previousFetch = globalThis.fetch;
  const previousCaches = globalThis.caches;
  globalThis.caches = { default: cache };
  globalThis.fetch = async (input) => {
    const request = input instanceof Request ? input : new Request(input);
    calls.push({
      url: request.url,
      authorization: request.headers.get('authorization') || '',
      range: request.headers.get('range'),
    });
    assert.equal(request.url.includes(SECRET), false);
    assert.equal((request.headers.get('authorization') || '').includes(SECRET), false);
    return originBehavior(request);
  };
  return {
    cache,
    calls,
    ctx: {
      waitUntil(promise) {
        pending.push(promise);
      },
    },
    async flush() {
      await Promise.all(pending);
      pending.length = 0;
    },
    restore() {
      globalThis.fetch = previousFetch;
      globalThis.caches = previousCaches;
    },
  };
}

function originResponse(request) {
  const range = request.headers.get('Range');
  if (range === 'bytes=0-1') {
    return new Response('AB', {
      status: 206,
      headers: {
        'Content-Type': 'video/quicktime',
        'Content-Length': '2',
        'Content-Range': 'bytes 0-1/100',
        'Accept-Ranges': 'bytes',
      },
    });
  }
  if (range === 'bytes=2-3') {
    return new Response('CD', {
      status: 206,
      headers: {
        'Content-Type': 'video/quicktime',
        'Content-Length': '2',
        'Content-Range': 'bytes 2-3/100',
        'Accept-Ranges': 'bytes',
      },
    });
  }
  if (range === 'deny') {
    return new Response('denied', { status: 403 });
  }
  if (range === 'deny-xml') {
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Error><Code>SignatureDoesNotMatch</Code>' +
        '<AWSAccessKeyId>unit-test-access-key</AWSAccessKeyId><StringToSign>x</StringToSign></Error>',
      { status: 403, headers: { 'x-amz-request-id': 'REQ123' } },
    );
  }
  return new Response('FULL', {
    status: 200,
    headers: {
      'Content-Type': 'video/quicktime',
      'Content-Length': '4',
      'Accept-Ranges': 'bytes',
    },
  });
}

let session;

afterEach(() => {
  session?.restore();
  session = null;
});

describe('media worker cache', () => {
  it('ignores query strings and keeps ranges in separate cache keys', () => {
    const first = cacheKeyFor(`${MEDIA}?cache=1`, 'bytes=0-1');
    const second = cacheKeyFor(MEDIA, 'bytes=0-1');
    const other = cacheKeyFor(MEDIA, 'bytes=2-3');
    const full = cacheKeyFor(`${MEDIA}?utm=1`, null);
    assert.equal(first.url, second.url);
    assert.notEqual(first.url, other.url);
    assert.equal(full.url, MEDIA);
    assert.equal(new URL(full.url).search, '');
  });

  it('stores a ranged response as status 200 for the Cache API', async () => {
    const stored = responseForCache(
      new Response('AB', {
        status: 206,
        headers: { 'Content-Range': 'bytes 0-1/100', 'Content-Length': '2' },
      }),
    );
    assert.equal(stored.status, 200);
    assert.equal(stored.headers.get(STORED_STATUS_HEADER), '206');
    assert.equal(await stored.text(), 'AB');
  });

  it('fetches S3 on a miss and serves the same range from cache on the next request', async () => {
    session = install(originResponse);
    const first = await worker.fetch(
      new Request(MEDIA, { headers: { Range: 'bytes=0-1' } }),
      env,
      session.ctx,
    );
    await session.flush();
    assert.equal(first.status, 206);
    assert.equal(first.headers.get('X-Media-Cache'), 'MISS');
    assert.equal(first.headers.get('Content-Range'), 'bytes 0-1/100');
    assert.equal(first.headers.get('Content-Length'), '2');
    assert.equal(first.headers.get('Content-Type'), 'video/quicktime');
    assert.equal(first.headers.get('Accept-Ranges'), 'bytes');
    assert.equal(first.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
    assert.equal(await first.text(), 'AB');
    assert.equal(session.calls.length, 1);
    assert.match(session.calls[0].authorization, /^AWS4-HMAC-SHA256 /);
    assert.equal(session.calls[0].range, 'bytes=0-1');
    assert.equal(session.calls[0].url.includes('X-Amz-'), false);
    assert.deepEqual(session.cache.putStatuses, [200]);

    const second = await worker.fetch(
      new Request(`${MEDIA}?unused=1`, { headers: { Range: 'bytes=0-1' } }),
      env,
      session.ctx,
    );
    assert.equal(second.status, 206);
    assert.equal(second.headers.get('X-Media-Cache'), 'HIT');
    assert.equal(second.headers.get('Content-Range'), 'bytes 0-1/100');
    assert.equal(second.headers.get(STORED_STATUS_HEADER), null);
    assert.equal(await second.text(), 'AB');
    assert.equal(session.calls.length, 1);
  });

  it('keeps a different Range on its own cache entry', async () => {
    session = install(originResponse);
    await worker.fetch(new Request(MEDIA, { headers: { Range: 'bytes=0-1' } }), env, session.ctx);
    await session.flush();
    const other = await worker.fetch(
      new Request(MEDIA, { headers: { Range: 'bytes=2-3' } }),
      env,
      session.ctx,
    );
    await session.flush();
    assert.equal(other.status, 206);
    assert.equal(other.headers.get('X-Media-Cache'), 'MISS');
    assert.equal(other.headers.get('Content-Range'), 'bytes 2-3/100');
    assert.equal(await other.text(), 'CD');

    const again = await worker.fetch(
      new Request(MEDIA, { headers: { Range: 'bytes=2-3' } }),
      env,
      session.ctx,
    );
    assert.equal(again.headers.get('X-Media-Cache'), 'HIT');
    assert.equal(await again.text(), 'CD');
    assert.equal(session.calls.length, 2);
  });

  it('does not return a cached partial body for a request without Range', async () => {
    session = install(originResponse);
    await worker.fetch(new Request(MEDIA, { headers: { Range: 'bytes=0-1' } }), env, session.ctx);
    await session.flush();
    const full = await worker.fetch(new Request(MEDIA), env, session.ctx);
    await session.flush();
    assert.equal(full.status, 200);
    assert.equal(full.headers.get('X-Media-Cache'), 'MISS');
    assert.equal(full.headers.get('Content-Range'), null);
    assert.equal(await full.text(), 'FULL');

    const fullHit = await worker.fetch(new Request(MEDIA), env, session.ctx);
    assert.equal(fullHit.status, 200);
    assert.equal(fullHit.headers.get('X-Media-Cache'), 'HIT');
    assert.equal(await fullHit.text(), 'FULL');
  });

  it('rejects an invalid key and does not fetch or cache it', async () => {
    session = install(originResponse);
    const response = await worker.fetch(
      new Request('https://media.woofskis.com/v1/not-a-submission.mp4'),
      env,
      session.ctx,
    );
    assert.equal(response.status, 404);
    assert.equal(session.calls.length, 0);
    assert.equal(session.cache.entries.size, 0);
  });

  it('does not cache an access-denied origin response', async () => {
    session = install(originResponse);
    const first = await worker.fetch(
      new Request(MEDIA, { headers: { Range: 'deny' } }),
      env,
      session.ctx,
    );
    await session.flush();
    const second = await worker.fetch(
      new Request(MEDIA, { headers: { Range: 'deny' } }),
      env,
      session.ctx,
    );
    assert.equal(first.status, 404);
    assert.equal(second.status, 404);
    assert.equal(session.calls.length, 2);
    assert.equal(session.cache.entries.size, 0);
  });

  it('logs the S3 error code without the access key id or secret', async () => {
    session = install(originResponse);
    const logged = [];
    const previousError = console.error;
    console.error = (...args) => logged.push(args.join(' '));
    try {
      const response = await worker.fetch(
        new Request(MEDIA, { headers: { Range: 'deny-xml' } }),
        env,
        session.ctx,
      );
      assert.equal(response.status, 404);
      assert.equal(await response.text(), 'Media unavailable');
    } finally {
      console.error = previousError;
    }
    assert.equal(logged.length, 1);
    assert.match(logged[0], /status 403 code SignatureDoesNotMatch request-id REQ123 credential unrecognized/);
    assert.equal(logged[0].includes(env.AWS_ACCESS_KEY_ID), false);
    assert.equal(logged[0].includes(SECRET), false);
    assert.equal(logged[0].includes('StringToSign'), false);
  });

  it('does not put the AWS secret or a public object ACL in the browser response', async () => {
    session = install(originResponse);
    const response = await worker.fetch(
      new Request(MEDIA, { headers: { Range: 'bytes=0-1' } }),
      env,
      session.ctx,
    );
    const headerText = [...response.headers.entries()].map(([name, value]) => `${name}:${value}`).join('\n');
    assert.equal(headerText.includes(SECRET), false);
    assert.equal(headerText.includes('public-read'), false);
    assert.equal((await response.text()).includes(SECRET), false);
  });

  it('trims whitespace and newlines from AWS environment credentials and bucket configuration', async () => {
    session = install(originResponse);
    const whitespaceEnv = {
      AWS_ACCESS_KEY_ID: '  unit-test-access-key\n',
      AWS_SECRET_ACCESS_KEY: `\n  ${SECRET} \r\n`,
      AWS_REGION: ' us-east-2\n',
      S3_BUCKET: ' woofskis-production-media \n',
    };
    const response = await worker.fetch(
      new Request(MEDIA, { headers: { Range: 'bytes=0-1' } }),
      whitespaceEnv,
      session.ctx,
    );
    assert.equal(response.status, 206);
    assert.equal(session.calls.length, 1);
    assert.match(session.calls[0].url, /^https:\/\/woofskis-production-media\.s3\.us-east-2\.amazonaws\.com\//);
    assert.equal(session.calls[0].url.includes(' '), false);
    assert.equal(session.calls[0].url.includes('%20'), false);
    assert.match(session.calls[0].authorization, /Credential=unit-test-access-key\//);
  });
});
