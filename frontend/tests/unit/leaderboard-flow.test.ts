import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  apiItemToLeaderboardItem,
  buildContestMetadata,
  isUuid,
  selectLeaderboardContestId,
} from '../../src/features/leaderboard/lib/leaderboard-flow';
import { ApiLeaderboardItem } from '../../src/services/leaderboard-api';

const ACTIVE_UUID = '11111111-1111-4111-8111-111111111111';
const JUDGING_UUID = '11111111-1111-4111-8111-111111111112';
const COMPLETED_UUID = '11111111-1111-4111-8111-111111111113';

describe('M09 leaderboard flow', () => {
  it('selects active contest UUID for tenant and falls back gracefully', () => {
    const selected = selectLeaderboardContestId({
      tenantKeys: ['woofskis'],
      contests: [
        { id: 'contest_woof_01', tenantId: 'woofskis', status: 'ACTIVE' },
        { id: JUDGING_UUID, tenantId: 'woofskis', status: 'JUDGING' },
        { id: ACTIVE_UUID, tenantId: 'woofskis', status: 'ACTIVE' },
      ],
    });
    assert.equal(selected, ACTIVE_UUID);

    const judging = selectLeaderboardContestId({
      tenantKeys: ['woofskis'],
      contests: [{ id: JUDGING_UUID, tenantId: 'woofskis', status: 'JUDGING' }],
    });
    assert.equal(judging, JUDGING_UUID);

    const fallback = selectLeaderboardContestId({
      tenantKeys: ['woofskis'],
      contests: [],
    });
    assert.equal(fallback, null);

    const prototypeId = selectLeaderboardContestId({
      tenantKeys: ['woofskis'],
      contests: [{ id: 'contest_woof_01', tenantId: 'woofskis', status: 'ACTIVE' }],
      preferredContestId: 'contest_woof_01',
    });
    assert.equal(prototypeId, null);
  });

  it('maps ApiLeaderboardItem to LeaderboardItem with gold/silver/bronze prize tiers', () => {
    const apiItem1: ApiLeaderboardItem = {
      rank: 1,
      id: 'sub-1',
      contestId: ACTIVE_UUID,
      contestTitle: 'Woofskis Challenge',
      title: 'Top Video',
      description: 'Funny video',
      videoUrl: 'https://example.com/v1.mp4',
      thumbnailUrl: 'https://example.com/t1.jpg',
      durationSeconds: 15,
      tags: ['comedy-skit', 'vfx'],
      communityScore: 4.9,
      totalVotes: 120,
      createdAt: '2026-09-02T10:00:00.000Z',
      creator: { id: 'c-1', name: 'Kai Tanaka' },
    };

    const item1 = apiItemToLeaderboardItem(apiItem1);
    assert.equal(item1.rank, 1);
    assert.equal(item1.prizeTier?.tier, 'GOLD');
    assert.equal(item1.prizeTier?.amount, '$12,500');
    assert.equal(item1.creatorHandle, '@kaitanaka');
    assert.equal(item1.category, 'comedy-skit');

    const apiItem2: ApiLeaderboardItem = {
      ...apiItem1,
      rank: 2,
      id: 'sub-2',
      communityScore: 4.8,
      creator: { id: 'c-2', name: 'Alex Rivera' },
    };
    const item2 = apiItemToLeaderboardItem(apiItem2);
    assert.equal(item2.rank, 2);
    assert.equal(item2.prizeTier?.tier, 'SILVER');

    const apiItem3: ApiLeaderboardItem = {
      ...apiItem1,
      rank: 3,
      id: 'sub-3',
      communityScore: 4.7,
      creator: { id: 'c-3', name: 'Jordan Vance' },
    };
    const item3 = apiItemToLeaderboardItem(apiItem3);
    assert.equal(item3.rank, 3);
    assert.equal(item3.prizeTier?.tier, 'BRONZE');

    const apiItem4: ApiLeaderboardItem = {
      ...apiItem1,
      rank: 4,
      id: 'sub-4',
      communityScore: 4.3,
    };
    const item4 = apiItemToLeaderboardItem(apiItem4);
    assert.equal(item4.rank, 4);
    assert.equal(item4.prizeTier, undefined);
  });

  it('builds contest metadata from API contest and status', () => {
    const activeMeta = buildContestMetadata(
      {
        id: ACTIVE_UUID,
        title: 'Active Contest',
        status: 'ACTIVE',
      },
      { totalEntries: 42, totalVotes: 1250, averageScore: 4.5 }
    );
    assert.equal(activeMeta.contestId, ACTIVE_UUID);
    assert.equal(activeMeta.title, 'Active Contest');
    assert.equal(activeMeta.status, 'ACTIVE');
    assert.equal(activeMeta.totalSubmissions, 42);
    assert.equal(activeMeta.totalVotesCast, 1250);

    const completedMeta = buildContestMetadata(
      {
        id: COMPLETED_UUID,
        title: 'Completed Contest',
        status: 'COMPLETED',
      },
      { totalEntries: 10, totalVotes: 500, averageScore: 4.2 }
    );
    assert.equal(completedMeta.status, 'CONCLUDED');
  });

  it('correctly validates UUID format with isUuid helper', () => {
    assert.equal(isUuid(ACTIVE_UUID), true);
    assert.equal(isUuid('contest_woof_01'), false);
    assert.equal(isUuid(''), false);
    assert.equal(isUuid(null), false);
    assert.equal(isUuid(undefined), false);
  });
});
