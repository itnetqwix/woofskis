import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  activateVideo,
  applySuccessfulRating,
  canNavigateWhileLoading,
  createVideoFeedSession,
  easedScrollTop,
  FEED_SCROLL_MS,
  formatAverageScore,
  formatVoteCount,
  isInPreloadWindow,
  mediaSlot,
  networkTierFromConnection,
  openRatingModal,
  preloadForSlot,
  preloadWindow,
  resultForActiveVideo,
  shouldMountMedia,
  skipWithoutRating,
} from '../../src/features/judging/lib/feed-state';
import {
  communityStarCount,
  isAllowedRating,
  isStarFilled,
  ratingToPrefill,
  RATING_SCALE_DEFINITIONS,
} from '../../src/constants/rating-scale';
import {
  applyMediaMuted,
  playbackAfterRejection,
  preferenceAfterAdvance,
  preferenceAfterSpeaker,
} from '../../src/features/judging/lib/playback-audio';
import { retainPlaybackUrl } from '../../src/features/judging/lib/playback-src';
import {
  notePlayback,
  playbackSamples,
  resetPlaybackSamples,
} from '../../src/features/judging/lib/playback-metrics';

const ROOT = fileURLToPath(new URL('../..', import.meta.url));

describe('video feed session', () => {
  it('does not disable navigation while the current or next video is loading', () => {
    const session = {
      ...createVideoFeedSession(),
      currentVideoLoading: true,
      nextVideoLoading: true,
    };
    assert.equal(canNavigateWhileLoading(session), true);
    const moved = activateVideo(session, 1, 3);
    assert.equal(moved.currentIndex, 1);
    assert.equal(moved.currentVideoLoading, true);
  });

  it('keeps only the previous, current, and next videos in the preload window', () => {
    assert.deepEqual(preloadWindow(0, 5), [0, 1]);
    assert.deepEqual(preloadWindow(2, 5), [1, 2, 3]);
    assert.equal(isInPreloadWindow(3, 2, 5), true);
    assert.equal(isInPreloadWindow(4, 2, 5), false);
  });

  it('opens the rating modal without recording a rating', () => {
    const opened = openRatingModal(createVideoFeedSession());
    assert.equal(opened.ratingModalOpen, true);
    assert.equal(opened.lastRatedVideo, null);
    assert.equal(opened.currentIndex, 0);
  });

  it('records the backend result and advances after a successful rating', () => {
    const next = applySuccessfulRating(
      createVideoFeedSession(),
      { videoId: 'video-a', averageScore: 4.2, voteCount: 183 },
      3
    );
    assert.equal(next.lastRatedVideo?.videoId, 'video-a');
    assert.equal(next.currentIndex, 1);
    assert.equal(next.ratingModalOpen, false);
  });

  it('does not change lastRatedVideo when the viewer skips', () => {
    const rated = applySuccessfulRating(
      createVideoFeedSession(),
      { videoId: 'video-a', averageScore: 4.2, voteCount: 183 },
      4
    );
    const skipped = skipWithoutRating(rated, 4);
    assert.equal(skipped.currentIndex, 2);
    assert.equal(skipped.lastRatedVideo?.videoId, 'video-a');
    const skippedAgain = skipWithoutRating(skipped, 4);
    assert.equal(skippedAgain.lastRatedVideo?.videoId, 'video-a');
    assert.equal(skippedAgain.currentIndex, 3);
  });

  it('keeps the last rated video when the next one is skipped, then replaces it', () => {
    const ratedA = applySuccessfulRating(
      createVideoFeedSession(),
      {
        videoId: 'video-a',
        averageScore: 8.4,
        voteCount: 124,
        thumbnailUrl: 'https://media.woofskis.com/posters/a.jpg',
        title: 'Video A',
      },
      3
    );
    assert.equal(ratedA.lastRatedVideo?.videoId, 'video-a');
    assert.equal(ratedA.currentIndex, 1);
    const skipped = skipWithoutRating(ratedA, 3);
    assert.equal(skipped.lastRatedVideo?.videoId, 'video-a');
    assert.equal(skipped.lastRatedVideo?.thumbnailUrl, 'https://media.woofskis.com/posters/a.jpg');
    assert.equal(resultForActiveVideo(skipped.lastRatedVideo, 'video-b')?.title, 'Video A');
    const ratedB = applySuccessfulRating(
      skipped,
      { videoId: 'video-b', averageScore: 9, voteCount: 2, thumbnailUrl: null, title: 'Video B' },
      3
    );
    assert.equal(ratedB.lastRatedVideo?.videoId, 'video-b');
    assert.equal(resultForActiveVideo(null, 'video-c'), null);
    assert.equal(formatAverageScore(8.4), '8.4');
    const ids = ['video-a', 'video-b', 'video-c'];
    const back = activateVideo(skipped, ids.indexOf('video-a'), ids.length);
    assert.equal(back.currentIndex, 0);
    assert.equal(back.lastRatedVideo?.videoId, 'video-a');
    assert.equal(back.lastRatedVideo?.averageScore, 8.4);
  });

  it('accepts integer ratings 1 and 10 and rejects 0, 11, and decimals', () => {
    assert.equal(RATING_SCALE_DEFINITIONS.length, 10);
    assert.equal(isAllowedRating(1), true);
    assert.equal(isAllowedRating(5), true);
    assert.equal(isAllowedRating(10), true);
    assert.equal(isAllowedRating(0), false);
    assert.equal(isAllowedRating(11), false);
    assert.equal(isAllowedRating(1.5), false);
    assert.equal(ratingToPrefill(8), 8);
    assert.equal(ratingToPrefill(null), null);
    assert.equal(ratingToPrefill(0), null);
    assert.equal(ratingToPrefill(1.5), null);
    for (let star = 1; star <= 10; star += 1) {
      assert.equal(isStarFilled(star, 8), star <= 8);
    }
    assert.equal(isStarFilled(1, null), false);
    assert.equal(communityStarCount(8.7), 9);
    assert.equal(easedScrollTop(0, 200, 0), 0);
    assert.equal(easedScrollTop(0, 200, 1), 200);
    assert.equal(FEED_SCROLL_MS >= 300 && FEED_SCROLL_MS <= 600, true);
  });

  it('keeps the audio preference across videos and survives a blocked play()', () => {
    assert.equal(preferenceAfterSpeaker(true), false);
    assert.equal(preferenceAfterSpeaker(false), true);
    assert.equal(preferenceAfterAdvance(false), false);
    assert.equal(preferenceAfterAdvance(true), true);
    const blocked = playbackAfterRejection(false, 'NotAllowedError');
    assert.equal(blocked.preferenceMuted, false);
    assert.equal(blocked.elementMuted, true);
    assert.equal(blocked.showTapForSound, true);
    const other = playbackAfterRejection(false, 'AbortError');
    assert.equal(other.showTapForSound, false);
    assert.equal(other.preferenceMuted, false);
    const attrs = new Map<string, string>();
    const el = {
      muted: true,
      defaultMuted: true,
      setAttribute(name: string, value: string) {
        attrs.set(name, value);
      },
      removeAttribute(name: string) {
        attrs.delete(name);
      },
    };
    applyMediaMuted(el, false);
    assert.equal(el.muted, false);
    assert.equal(el.defaultMuted, false);
    assert.equal(attrs.has('muted'), false);
    applyMediaMuted(el, true);
    assert.equal(attrs.get('muted'), '');
  });

  it('shows the last rated result only on a later video', () => {
    const rated = { videoId: 'video-a', averageScore: 4.2, voteCount: 183 };
    assert.equal(resultForActiveVideo(null, 'video-b'), null);
    assert.equal(resultForActiveVideo(rated, 'video-a'), null);
    const visible = resultForActiveVideo(rated, 'video-d');
    assert.equal(visible?.averageScore, 4.2);
    assert.equal(visible?.voteCount, 183);
    assert.equal(formatAverageScore(visible!.averageScore), '4.2');
    assert.equal(formatVoteCount(visible!.voteCount), '183');
  });

  it('keeps the loading overlay from capturing swipes', () => {
    const slide = readFileSync(
      join(ROOT, 'src/features/judging/components/video-slide.tsx'),
      'utf8'
    );
    assert.equal(slide.includes('touch-none'), false);
    assert.match(
      slide,
      /pointer-events-none absolute inset-0 z-20 flex items-center justify-center/
    );
    assert.match(slide, /preload=\{preloadMode === 'none' \? 'metadata' : preloadMode\}/);
    assert.match(slide, /pointer-events-none/);
    assert.match(slide, /playsInline/);
    assert.equal(slide.includes('muted={true}'), false);
    assert.match(slide, /Tap for sound/);
    assert.match(slide, /onPlaybackEnded\?\.\(\)/);
    assert.equal(slide.includes('onNext?.()'), false);

    const card = readFileSync(
      join(ROOT, 'src/features/judging/components/previous-rated-card.tsx'),
      'utf8'
    );
    assert.match(card, /\/ 10/);
    assert.match(card, /Previously rated/);
    assert.match(card, /<img/);
    assert.match(card, /formatVoteCount/);
    assert.match(card, /motion-reduce:animate-none/);
    assert.match(card, /Return to /);
    assert.match(card, /onSelect/);
    assert.equal(card.includes('scale={5}'), false);

    const bar = readFileSync(join(ROOT, 'src/features/judging/components/rating-bar.tsx'), 'utf8');
    assert.match(bar, /Select a rating to see the next video/);
    assert.match(bar, /or skip to the next video/);
    assert.match(bar, /data-rating-scale="10"/);
    assert.match(bar, /StarRating/);
    assert.match(bar, /scale=\{RATING_MAX\}/);
    assert.equal(bar.includes('scale={5}'), false);
    assert.equal(bar.includes('>{value}<'), false);

    const queue = readFileSync(
      join(ROOT, 'src/features/judging/hooks/use-contest-queue.ts'),
      'utf8'
    );
    assert.match(queue, /e\.key === '0'/);
    assert.match(queue, /submitRating\(10\)/);
    assert.equal(queue.includes("e.key <= '5'"), false);

    const modal = readFileSync(
      join(ROOT, 'src/features/judging/components/rating-modal.tsx'),
      'utf8'
    );
    assert.match(modal, /Your rating/);
    assert.match(modal, /Community/);
    assert.equal(modal.includes('out of 5'), false);
    assert.equal(modal.includes('grid-cols-5'), false);

    const stars = readFileSync(
      join(ROOT, 'src/features/judging/components/star-rating.tsx'),
      'utf8'
    );
    assert.match(stars, /scale = RATING_MAX/);
    assert.match(stars, /Rate \$\{star\} out of \$\{starCount\}/);
    assert.match(stars, /#8BC144/);

    const celebration = readFileSync(
      join(ROOT, 'src/features/judging/components/star-celebration.tsx'),
      'utf8'
    );
    assert.match(celebration, /pointer-events-none/);
    assert.match(celebration, /#8BC144/);
    assert.match(celebration, /prefers-reduced-motion/);
    const particleCount = (celebration.match(/size: \d+/g) ?? []).length;
    assert.ok(particleCount >= 14 && particleCount <= 18);
    const heroStars = celebration.match(/size: 4[2-8]/g) ?? [];
    assert.ok(heroStars.length >= 1 && heroStars.length <= 3);

    const rail = readFileSync(
      join(ROOT, 'src/features/judging/components/video-action-rail.tsx'),
      'utf8'
    );
    assert.equal(rail.includes('Rate this video'), false);
    assert.equal(rail.includes('<Star'), false);
    assert.match(rail, /aria-label="Comments"/);
    assert.match(rail, /Unmute video/);
    assert.match(rail, /Mute video/);
    assert.match(rail, /h-12 w-12/);
  });

  it('preloads current and next on fast networks and current only when saving data', () => {
    assert.equal(networkTierFromConnection(null), 'normal');
    assert.equal(networkTierFromConnection({ saveData: true, effectiveType: '4g' }), 'save-data');
    assert.equal(networkTierFromConnection({ effectiveType: '2g' }), 'slow');
    assert.equal(networkTierFromConnection({ effectiveType: '3g' }), 'slow');
    assert.equal(networkTierFromConnection({ effectiveType: '4g' }), 'fast');
    assert.equal(mediaSlot(2, 2, 5), 'current');
    assert.equal(mediaSlot(3, 2, 5), 'next');
    assert.equal(mediaSlot(1, 2, 5), 'previous');
    assert.equal(mediaSlot(4, 2, 5), 'idle');
    assert.equal(preloadForSlot('current', 'save-data'), 'auto');
    assert.equal(preloadForSlot('next', 'fast'), 'auto');
    assert.equal(preloadForSlot('next', 'slow'), 'metadata');
    assert.equal(preloadForSlot('next', 'save-data'), 'none');
    assert.equal(preloadForSlot('previous', 'fast'), 'metadata');
    assert.equal(shouldMountMedia('idle', 'fast'), false);
    assert.equal(shouldMountMedia('next', 'save-data'), false);
    assert.equal(shouldMountMedia('previous', 'slow'), false);
  });

  it('keeps a presigned playback URL until it is close to expiry', () => {
    const current =
      'https://woofskis-production-media.s3.us-east-2.amazonaws.com/contests/a/creators/b/c.mp4?X-Amz-Date=20261003T120000Z&X-Amz-Expires=900&X-Amz-Signature=one';
    const refreshed =
      'https://woofskis-production-media.s3.us-east-2.amazonaws.com/contests/a/creators/b/c.mp4?X-Amz-Date=20261003T120500Z&X-Amz-Expires=900&X-Amz-Signature=two';
    const issued = Date.UTC(2026, 9, 3, 12, 0, 0);
    assert.equal(retainPlaybackUrl(current, refreshed, issued + 60_000), current);
    assert.equal(retainPlaybackUrl(current, refreshed, issued + 800_000), refreshed);
    const cdn = 'https://media.woofskis.com/v1/contests/a/creators/b/c.mp4';
    assert.equal(retainPlaybackUrl(cdn, `${cdn}?cache=1`, issued), cdn);
    resetPlaybackSamples();
    notePlayback('video-a', 'loadstart');
    notePlayback('video-a', 'loadeddata');
    const sample = playbackSamples().at(-1);
    assert.equal(sample?.event, 'loadeddata');
    assert.equal(sample?.videoId, 'video-a');
    assert.equal(typeof sample?.sinceLoadStartMs, 'number');
  });

  it('formalizes the 1-10 rating area with a subtle border and glassmorphism styling', () => {
    const bar = readFileSync(join(ROOT, 'src/features/judging/components/rating-bar.tsx'), 'utf8');
    assert.match(bar, /border-white\/15/);
    assert.match(bar, /rounded-2xl/);
    assert.match(bar, /backdrop-blur-md/);
    assert.match(bar, /ring-1 ring-inset ring-white\/5/);
  });

  it('renders a poster backdrop behind video element for seamless flash-free transitions', () => {
    const slide = readFileSync(
      join(ROOT, 'src/features/judging/components/video-slide.tsx'),
      'utf8'
    );
    assert.match(slide, /video\.thumbnailUrl && \(/);
    assert.match(slide, /<img\s+src=\{video\.thumbnailUrl\}/);
    assert.match(slide, /pointer-events-none absolute inset-0 h-full w-full object-cover/);
  });
});
