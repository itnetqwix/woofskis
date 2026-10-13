/**
 * Session state for the vertical judging feed.
 *
 * lastRatedVideo is the most recent submission whose rating API succeeded.
 * It is not the video the viewer just swiped away from.
 */

export interface LastRatedVideo {
  videoId: string;
  averageScore: number;
  voteCount: number;
  userRating?: number | null;
  thumbnailUrl?: string | null;
  title?: string | null;
  creatorName?: string | null;
  creatorHandle?: string | null;
  creatorAvatarUrl?: string | null;
}

export interface VideoFeedSession {
  currentIndex: number;
  lastRatedVideo: LastRatedVideo | null;
  ratingModalOpen: boolean;
  commentsOpen: boolean;
  currentVideoLoading: boolean;
  nextVideoLoading: boolean;
}

export function createVideoFeedSession(): VideoFeedSession {
  return {
    currentIndex: 0,
    lastRatedVideo: null,
    ratingModalOpen: false,
    commentsOpen: false,
    currentVideoLoading: false,
    nextVideoLoading: false,
  };
}

/**
 * A video that is still loading, buffering, or failing must not freeze the feed.
 * Modal and comment layers are separate; they do not count as a loading lock.
 */
export function canNavigateWhileLoading(
  session: Pick<VideoFeedSession, 'currentVideoLoading' | 'nextVideoLoading'>
): boolean {
  void session.currentVideoLoading;
  void session.nextVideoLoading;
  return true;
}

/** Nearby window only: previous, current, and next. */
export function preloadWindow(currentIndex: number, videoCount: number): number[] {
  return [currentIndex - 1, currentIndex, currentIndex + 1].filter(
    (index) => index >= 0 && index < videoCount
  );
}

export type NetworkTier = 'save-data' | 'slow' | 'normal' | 'fast';
export type MediaPreload = 'none' | 'metadata' | 'auto';
export type MediaSlot = 'idle' | 'previous' | 'current' | 'next';

/**
 * Missing Network Information API stays on the normal tier.
 * That still preloads only the next video, not the whole feed.
 */
export function networkTierFromConnection(
  connection: { saveData?: boolean; effectiveType?: string } | null | undefined
): NetworkTier {
  if (!connection) return 'normal';
  if (connection.saveData) return 'save-data';
  switch (connection.effectiveType) {
    case 'slow-2g':
    case '2g':
    case '3g':
      return 'slow';
    case '4g':
      return 'fast';
    default:
      return 'normal';
  }
}

export function mediaSlot(index: number, currentIndex: number, videoCount: number): MediaSlot {
  if (index < 0 || index >= videoCount) return 'idle';
  if (index === currentIndex) return 'current';
  if (index === currentIndex + 1) return 'next';
  if (index === currentIndex - 1) return 'previous';
  return 'idle';
}

/**
 * Current always loads.
 * Next loads fully on normal and fast networks, metadata only on slow, and
 * not at all when Save-Data is on.
 * Previous keeps metadata on normal and fast networks for a reverse swipe.
 */
export function preloadForSlot(slot: MediaSlot, tier: NetworkTier): MediaPreload {
  if (slot === 'current') return 'auto';
  if (slot === 'next') {
    if (tier === 'save-data') return 'none';
    if (tier === 'slow') return 'metadata';
    return 'auto';
  }
  if (slot === 'previous' && (tier === 'normal' || tier === 'fast')) return 'metadata';
  return 'none';
}

export function shouldMountMedia(slot: MediaSlot, tier: NetworkTier): boolean {
  return preloadForSlot(slot, tier) !== 'none';
}

export function isInPreloadWindow(
  index: number,
  currentIndex: number,
  videoCount: number
): boolean {
  return preloadWindow(currentIndex, videoCount).includes(index);
}

export function activateVideo(
  session: VideoFeedSession,
  index: number,
  videoCount: number
): VideoFeedSession {
  if (!canNavigateWhileLoading(session)) return session;
  if (index < 0 || index >= videoCount || index === session.currentIndex) return session;
  return {
    ...session,
    currentIndex: index,
  };
}

export function openRatingModal(session: VideoFeedSession): VideoFeedSession {
  return { ...session, ratingModalOpen: true };
}

export function applySuccessfulRating(
  session: VideoFeedSession,
  rated: LastRatedVideo,
  videoCount: number
): VideoFeedSession {
  const canAdvance = session.currentIndex < videoCount - 1;
  return {
    ...session,
    lastRatedVideo: rated,
    currentIndex: canAdvance ? session.currentIndex + 1 : session.currentIndex,
    ratingModalOpen: false,
    commentsOpen: false,
    currentVideoLoading: canAdvance ? session.nextVideoLoading : session.currentVideoLoading,
    nextVideoLoading: false,
  };
}

/** Swipe or scroll without a successful rating leaves lastRatedVideo unchanged. */
export function skipWithoutRating(session: VideoFeedSession, videoCount: number): VideoFeedSession {
  const canAdvance = session.currentIndex < videoCount - 1;
  return {
    ...session,
    currentIndex: canAdvance ? session.currentIndex + 1 : session.currentIndex,
    lastRatedVideo: session.lastRatedVideo,
  };
}

/**
 * The compact result belongs on the active video only when it describes
 * a different, already-rated submission.
 */
export function resultForActiveVideo(
  lastRated: LastRatedVideo | null,
  activeVideoId: string | null
): LastRatedVideo | null {
  if (!lastRated || !activeVideoId) return null;
  if (lastRated.videoId === activeVideoId) return null;
  return lastRated;
}

export const FEED_SCROLL_MS = 450;

/** Cubic ease-out from start to target. progress is 0–1. */
export function easedScrollTop(start: number, target: number, progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  const eased = 1 - (1 - t) ** 3;
  return start + (target - start) * eased;
}

export function formatAverageScore(score: number): string {
  return score.toFixed(1);
}

export function formatVoteCount(count: number): string {
  return String(count);
}
