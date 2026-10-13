import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildScoreboardPath, buildVideoShareUrl } from '../../src/features/judging/lib/share-url';

describe('share urls', () => {
  it('uses the given origin and the judging video query', () => {
    const url = buildVideoShareUrl(
      'https://woofskis.example',
      '22222222-2222-4222-8222-222222222221'
    );
    assert.equal(url, 'https://woofskis.example/?v=22222222-2222-4222-8222-222222222221');
  });

  it('builds a contest scoreboard path that survives refresh', () => {
    assert.equal(
      buildScoreboardPath('11111111-1111-4111-8111-111111111111'),
      '/leaderboard?contest=11111111-1111-4111-8111-111111111111'
    );
  });
});
