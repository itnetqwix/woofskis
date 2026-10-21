import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildScoreboardPath,
  buildSmsShareHref,
  buildVideoShareMessage,
  buildVideoShareText,
  buildVideoShareUrl,
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
    const message = buildVideoShareMessage('Park zoomies', page);
    assert.equal(buildVideoShareText('Park zoomies'), 'Watch "Park zoomies" on Woofskis');
    assert.equal(message, `Watch "Park zoomies" on Woofskis ${page}`);
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
});
