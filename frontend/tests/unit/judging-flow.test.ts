import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_AUTO_ADVANCE_DELAY_MS,
  VIEWER_MUTE_STORAGE_KEY,
  emptyQueueFallback,
  isRatingActiveForVideo,
  isTypingTarget,
  isUnratedEndHintHidden,
  mapRateResult,
  queueItemToVideo,
  resolveAutoAdvanceDelayMs,
  revealStepCount,
  selectJudgingContestId,
} from '../../src/features/judging/lib/judging-flow';

const ACTIVE = '11111111-1111-4111-8111-111111111111';
const JUDGING = '11111111-1111-4111-8111-111111111112';
const OTHER = '11111111-1111-4111-8111-111111111113';

describe('M08 judging flow', () => {
  it('prefers an ACTIVE contest over JUDGING and ignores mock ids', () => {
    const id = selectJudgingContestId({
      tenantKeys: ['woofskis'],
      contests: [
        {
          id: 'contest-woofskis-s1',
          tenantId: 'woofskis',
          status: 'ACTIVE',
          updatedAt: '2026-10-02',
        },
        { id: JUDGING, tenantId: 'woofskis', status: 'JUDGING', updatedAt: '2026-10-03' },
        { id: ACTIVE, tenantId: 'woofskis', status: 'ACTIVE', updatedAt: '2026-10-01' },
        { id: OTHER, tenantId: 'other', status: 'ACTIVE', updatedAt: '2026-10-04' },
      ],
    });
    assert.equal(id, ACTIVE);
  });

  it('uses a UUID activeContestId only when no open stored contest exists', () => {
    const missing = selectJudgingContestId({
      tenantKeys: ['woofskis'],
      contests: [],
      preferredContestId: 'not-a-uuid',
    });
    assert.equal(missing, null);
    const preferred = selectJudgingContestId({
      tenantKeys: ['woofskis'],
      contests: [],
      preferredContestId: ACTIVE,
    });
    assert.equal(preferred, ACTIVE);
  });

  it('shows the unrated-end hint until the device hides it', () => {
    assert.equal(isUnratedEndHintHidden(null), false);
    assert.equal(isUnratedEndHintHidden(''), false);
    assert.equal(isUnratedEndHintHidden('0'), false);
    assert.equal(isUnratedEndHintHidden('1'), true);
  });

  it('uses the contest delay and falls back to 1800', () => {
    assert.equal(resolveAutoAdvanceDelayMs(1800), 1800);
    assert.equal(resolveAutoAdvanceDelayMs(2400), 2400);
    assert.equal(resolveAutoAdvanceDelayMs(undefined), DEFAULT_AUTO_ADVANCE_DELAY_MS);
    assert.equal(DEFAULT_AUTO_ADVANCE_DELAY_MS, 1800);
    assert.equal(revealStepCount(1800), 90);
    assert.equal(revealStepCount(2400), 120);
  });

  it('reveals the server score instead of a client average', () => {
    const result = mapRateResult({
      videoId: 'vid',
      userRating: 3,
      previousScore: 4.7,
      newScore: 4.1,
      delta: -0.6,
      totalVotes: 3,
    });
    assert.equal(result.newCommunityScore, 4.1);
    assert.equal(result.delta, -0.6);
    assert.equal(result.newTotalVotes, 3);
    assert.equal(result.previousVotes, 2);
    assert.equal(result.userRating, 3);
  });

  it('maps approved queue items and keeps the empty showcase off the rate path', () => {
    const video = queueItemToVideo({
      id: '22222222-2222-4222-8222-222222222221',
      title: 'Sketch',
      description: null,
      videoUrl: 'https://example.com/a.mp4',
      thumbnailUrl: null,
      durationSeconds: 12,
      tags: ['sketch'],
      communityScore: 0,
      totalVotes: 0,
      category: null,
      creator: { name: 'Ada Creator' },
    });
    assert.equal(video.creatorName, 'Ada Creator');
    assert.equal(video.category, '');
    const fallback = emptyQueueFallback({ brandName: 'Woofskis', brandSlug: 'woofskis' });
    assert.equal(fallback.id.startsWith('empty-'), true);
    assert.equal(VIEWER_MUTE_STORAGE_KEY, 'cos_viewer_muted_preference');
  });

  it('ignores hotkeys while typing', () => {
    const input = { tagName: 'INPUT', isContentEditable: false } as HTMLElement;
    const div = { tagName: 'DIV', isContentEditable: false } as HTMLElement;
    assert.equal(isTypingTarget(input), true);
    assert.equal(isTypingTarget(div), false);
    assert.equal(isTypingTarget(null), false);
  });

  it('enforces rating visibility: active only, hidden for completed, judging, draft, and deleted contests', () => {
    // Only ACTIVE contests with ratingOpen !== false have ratings active
    assert.equal(isRatingActiveForVideo({ contestStatus: 'ACTIVE', ratingOpen: true }), true);
    assert.equal(isRatingActiveForVideo({ contestStatus: 'ACTIVE' }), true);
    assert.equal(isRatingActiveForVideo({ contestStatus: 'ACTIVE', ratingOpen: false }), false);

    // Completed, judging, draft, or deleted contests have rating section hidden
    assert.equal(isRatingActiveForVideo({ contestStatus: 'COMPLETED', ratingOpen: false }), false);
    assert.equal(isRatingActiveForVideo({ contestStatus: 'COMPLETED', ratingOpen: true }), false);
    assert.equal(isRatingActiveForVideo({ contestStatus: 'JUDGING', ratingOpen: false }), false);
    assert.equal(isRatingActiveForVideo({ contestStatus: 'JUDGING', ratingOpen: true }), false);
    assert.equal(isRatingActiveForVideo({ contestStatus: 'DRAFT', ratingOpen: false }), false);
    assert.equal(isRatingActiveForVideo({ contestStatus: 'DELETED', ratingOpen: false }), false);
    assert.equal(isRatingActiveForVideo({ contestStatus: 'ARCHIVED', ratingOpen: false }), false);
    assert.equal(isRatingActiveForVideo(null), false);
    assert.equal(isRatingActiveForVideo(undefined), false);
  });

  it('preserves all video properties when contest is deleted, completed, or draft', () => {
    const deletedVideo = queueItemToVideo({
      id: 'video-deleted-1',
      contestId: 'contest-del-1',
      contestStatus: 'DELETED',
      ratingOpen: false,
      title: 'Top Dog Trick',
      description: 'A dog doing flips',
      videoUrl: 'https://media.woofskis.com/v1/del.mp4',
      thumbnailUrl: 'https://media.woofskis.com/v1/del.jpg',
      durationSeconds: 30,
      tags: ['tricks', 'dogs'],
      communityScore: 8.5,
      totalVotes: 42,
      category: 'Tricks',
      creator: { name: 'Barker' },
    });

    assert.equal(deletedVideo.id, 'video-deleted-1');
    assert.equal(deletedVideo.title, 'Top Dog Trick');
    assert.equal(deletedVideo.contestStatus, 'DELETED');
    assert.equal(deletedVideo.ratingOpen, false);
    assert.equal(deletedVideo.creatorName, 'Barker');
    assert.equal(deletedVideo.videoUrl, 'https://media.woofskis.com/v1/del.mp4');
    assert.equal(deletedVideo.durationSeconds, 30);
    assert.equal(deletedVideo.communityScore, 8.5);
    assert.equal(isRatingActiveForVideo(deletedVideo), false);

    const completedVideo = queueItemToVideo({
      id: 'video-comp-1',
      contestId: 'contest-comp-1',
      contestStatus: 'COMPLETED',
      ratingOpen: false,
      title: 'Agility Run',
      description: 'Fast pup',
      videoUrl: 'https://media.woofskis.com/v1/run.mp4',
      thumbnailUrl: null,
      durationSeconds: 25,
      tags: ['agility'],
      communityScore: 9.1,
      totalVotes: 100,
      category: 'Agility',
      creator: { name: 'Runner' },
    });
    assert.equal(completedVideo.contestStatus, 'COMPLETED');
    assert.equal(completedVideo.ratingOpen, false);
    assert.equal(isRatingActiveForVideo(completedVideo), false);
  });
});
