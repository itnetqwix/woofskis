/**
 * Private S3 origin for approved Woofskis video.
 *
 * Browser requests https://media.woofskis.com/v1/<object-key>.
 * This worker signs the S3 GetObject with credentials stored as Worker
 * secrets. The browser never receives AWS keys or an S3 URL.
 *
 * The bucket stays private. Only backend-issued submission keys are fetched.
 * Query strings are ignored so they cannot change the cache identity.
 * Range is forwarded so playback can start before the full object downloads.
 *
 * This file is not deployed by the application build.
 * See docs/knowledge/video-delivery.md for the DNS and cache checklist.
 */

import { AwsClient } from 'aws4fetch';

const CACHE_CONTROL = 'public, max-age=31536000, immutable';

const SUBMISSION_KEY =
  /^contests\/[0-9a-f-]{36}\/creators\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(mp4|webm|mov)$/i;

const LEGACY_SUBMISSION_KEY =
  /^org\/[0-9a-f-]{36}\/contests\/[0-9a-f-]{36}\/creators\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(mp4|webm|mov)$/i;

const THUMBNAIL_KEY =
  /^contests\/[0-9a-f-]{36}\/creators\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/i;

const FORWARDED_HEADERS = [
  'content-type',
  'content-length',
  'content-range',
  'accept-ranges',
  'etag',
  'last-modified',
];

function submissionKeyFromPath(pathname) {
  if (!pathname.startsWith('/v1/')) return null;
  let key = pathname.slice('/v1/'.length);
  try {
    key = key
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/');
  } catch {
    return null;
  }
  if (key.includes('..') || key.includes('\\') || key.startsWith('/')) return null;
  if (
    !SUBMISSION_KEY.test(key) &&
    !LEGACY_SUBMISSION_KEY.test(key) &&
    !THUMBNAIL_KEY.test(key)
  ) {
    return null;
  }
  return key;
}

function contentTypeForKey(key) {
  if (key.endsWith('.jpg')) return 'image/jpeg';
  if (key.endsWith('.webm')) return 'video/webm';
  if (key.endsWith('.mov')) return 'video/quicktime';
  return 'video/mp4';
}

/**
 * Cache identity is the media path plus the exact Range header.
 * Browser query strings are removed so they do not fragment the cache.
 * A request without Range does not share an entry with a partial range.
 */
export function cacheKeyFor(requestUrl, range) {
  const url = new URL(requestUrl);
  url.search = '';
  url.hash = '';
  if (range) url.searchParams.set('range', range);
  return new Request(url.toString(), { method: 'GET' });
}

/**
 * caches.default.put accepts status 200 only. A 206 is stored as 200 and
 * the real status is kept in a header that is removed before the browser
 * sees the response. The body stays the exact bytes for that Range.
 */
export const STORED_STATUS_HEADER = 'X-Rips-Stored-Status';

export function responseForCache(response) {
  const headers = new Headers(response.headers);
  headers.set(STORED_STATUS_HEADER, String(response.status));
  headers.delete('X-Media-Cache');
  return new Response(response.body, {
    status: 200,
    headers,
  });
}

export function responseFromCache(stored, method) {
  const headers = new Headers(stored.headers);
  const storedStatus = Number(headers.get(STORED_STATUS_HEADER) || stored.status);
  headers.delete(STORED_STATUS_HEADER);
  headers.set('X-Media-Cache', 'HIT');
  const status = storedStatus === 206 ? 206 : 200;
  return new Response(method === 'HEAD' ? null : stored.body, {
    status,
    headers,
  });
}

/**
 * S3 error bodies can echo the access key id and the string to sign.
 * Only the <Code> element is returned, and only when it is a plain word.
 */
export async function originErrorCode(origin) {
  try {
    const body = await origin.text();
    const code = /<Code>([A-Za-z]{1,64})<\/Code>/.exec(body)?.[1];
    return code || 'unknown';
  } catch {
    return 'unknown';
  }
}

function credentialKind(accessKeyId) {
  if (accessKeyId.startsWith('AKIA')) return 'long-term';
  if (accessKeyId.startsWith('ASIA')) return 'temporary';
  return 'unrecognized';
}

function mediaHeaders(origin, key) {
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = origin.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (!headers.has('content-type')) headers.set('Content-Type', contentTypeForKey(key));
  if (!headers.has('accept-ranges')) headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', CACHE_CONTROL);
  headers.set('CDN-Cache-Control', CACHE_CONTROL);
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Expose-Headers', 'Accept-Ranges, Content-Range, Content-Length, Content-Type');
  headers.set('X-Content-Type-Options', 'nosniff');
  return headers;
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD',
          'Access-Control-Allow-Headers': 'Range',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }

    const key = submissionKeyFromPath(new URL(request.url).pathname);
    if (!key) return new Response('Not found', { status: 404 });

    const accessKeyId = env.AWS_ACCESS_KEY_ID?.trim();
    const secretAccessKey = env.AWS_SECRET_ACCESS_KEY?.trim();
    const region = env.AWS_REGION?.trim();
    const bucket = env.S3_BUCKET?.trim();

    if (!accessKeyId || !secretAccessKey || !region || !bucket) {
      return new Response('Media origin is not configured', { status: 503 });
    }

    const range = request.headers.get('Range');
    const cache = caches.default;
    const cacheKey = cacheKeyFor(request.url, range);
    const hit = await cache.match(cacheKey);
    if (hit) return responseFromCache(hit, request.method);

    const encoded = key
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    const objectUrl = `https://${bucket}.s3.${region}.amazonaws.com/${encoded}`;
    const aws = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: 's3',
      region,
    });
    const originHeaders = new Headers();
    if (range) originHeaders.set('Range', range);
    const signed = await aws.sign(objectUrl, { method: 'GET', headers: originHeaders });
    const origin = await fetch(signed);

    if (origin.status !== 200 && origin.status !== 206) {
      const code = await originErrorCode(origin);
      console.error(
        `media origin returned status ${origin.status} code ${code} ` +
          `request-id ${origin.headers.get('x-amz-request-id') || 'none'} ` +
          `credential ${credentialKind(accessKeyId)} for key ${key}`,
      );
      return new Response('Media unavailable', {
        status: origin.status === 404 || origin.status === 403 ? 404 : 502,
      });
    }

    const headers = mediaHeaders(origin, key);
    headers.set('X-Media-Cache', 'MISS');
    const response = new Response(request.method === 'HEAD' ? null : origin.body, {
      status: origin.status,
      headers,
    });

    if (request.method === 'GET' && (origin.status === 200 || origin.status === 206)) {
      const cached = responseForCache(response.clone());
      ctx.waitUntil(
        cache.put(cacheKey, cached).catch((error) => {
          console.error(
            'media cache put failed',
            error instanceof Error ? error.message : 'unknown',
          );
        }),
      );
    }

    return response;
  },
};
