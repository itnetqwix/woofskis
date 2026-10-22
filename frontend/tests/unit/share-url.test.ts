import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScoreboardPath,
  buildSmsShareHref,
  buildVideoShareMessage,
  buildVideoShareText,
  buildVideoShareUrl,
  canonicalShareOrigin,
  isPublicSharePageUrl,
} from '../../src/features/judging/lib/share-url';

const SUBMISSION_ID = '22222222-2222-4222-8222-222222222221';

describe('share urls', () => {
  it('uses the given origin and the judging video query', () => {
    const url = buildVideoShareUrl('https://woofskis.example', SUBMISSION_ID);
    assert.equal(url, `https://woofskis.example/?v=${SUBMISSION_ID}`);
    assert.equal(isPublicSharePageUrl(url), true);
  });

  it('builds a contest scoreboard path that survives refresh', () => {
    assert.equal(
      buildScoreboardPath('11111111-1111-4111-8111-111111111111'),
      '/leaderboard?contest=11111111-1111-4111-8111-111111111111'
    );
  });

  it('shares the public page with a short message and rejects storage urls', () => {
    const page = buildVideoShareUrl('https://woofskis.example', SUBMISSION_ID);
    const message = buildVideoShareMessage('Park zoomies', page, {
      creatorName: 'Ada',
      description: 'A very good dog.',
    });
    assert.equal(
      buildVideoShareText('Park zoomies', { creatorName: 'Ada', description: 'A very good dog.' }),
      'Watch "Park zoomies" by Ada on Woofskis\nA very good dog.',
    );
    assert.equal(message, `Watch "Park zoomies" by Ada on Woofskis\nA very good dog.\n${page}`);
    assert.equal(message.endsWith(page), true);
    assert.equal(message.includes('X-Amz-'), false);
    assert.equal(message.includes('amazonaws.com'), false);
    assert.match(buildSmsShareHref(message), /^sms:\?&body=/);
    assert.equal(
      isPublicSharePageUrl(
        'https://bucket.s3.amazonaws.com/contests/a/creators/b/c.mp4?X-Amz-Signature=abc'
      ),
      false
    );
    assert.equal(isPublicSharePageUrl('contests/a/creators/b/c.mp4'), false);
  });

  it('uses the configured public origin for every share link', () => {
    const canonical = 'https://www.woofskis.com';
    assert.equal(canonicalShareOrigin('https://woofskis.com', canonical), canonical);
    assert.equal(
      buildVideoShareUrl(canonicalShareOrigin('https://woofskis.com', canonical), SUBMISSION_ID),
      `https://www.woofskis.com/?v=${SUBMISSION_ID}`,
    );
    assert.equal(
      canonicalShareOrigin('http://192.168.1.20:3000', 'http://localhost:3000'),
      'http://192.168.1.20:3000',
    );
  });

  it('fills in a description when the video has none', () => {
    const page = buildVideoShareUrl('https://www.woofskis.com', SUBMISSION_ID);
    const message = buildVideoShareMessage('Park zoomies', page, { creatorName: 'Ada' });
    assert.match(message, /Watch "Park zoomies" by Ada on Woofskis/);
    assert.match(message, /Watch and rate this video on Woofskis\./);
    assert.equal(message.endsWith(page), true);
  });
});
