import type { AggregatedScoreResult, ContestVideoItem } from '@/types/contest';

/**
 * Client judging helpers (M08-P04).
 *
 * Public contest discovery is NOT SPECIFIED (there is no public contest list).
 * The page uses one stored contest for the active tenant whose status is
 * ACTIVE, otherwise JUDGING, when that id is a UUID. Otherwise it uses
 * `activeContestId` when that value is a UUID.
 *
 * One viewer has one current rating per submission. A later submit updates
 * that rating. An in-flight guard lives in the hook so one click does not
 * fire two requests.
 *
 * Score reveal uses the server previousScore, newScore, delta, and totalVotes.
 * The delay is Contest.autoAdvanceDelayMs. 1800 is only the fallback when
 * the contest value is missing.
 */

export const DEFAULT_AUTO_ADVANCE_DELAY_MS = 1800;
export const VIEWER_MUTE_STORAGE_KEY = 'cos_viewer_muted_preference';
/** Device-local. Unchecked means the first unrated ending still shows the hint. */
export const UNRATED_END_HINT_KEY = 'cos_unrated_end_hint_hidden';

export function isUnratedEndHintHidden(stored: string | null): boolean {
  return stored === '1';
}

export function readUnratedEndHintHidden(): boolean {
  try {
    return isUnratedEndHintHidden(localStorage.getItem(UNRATED_END_HINT_KEY));
  } catch {
    return false;
  }
}

export function writeUnratedEndHintHidden(hidden: boolean): void {
  try {
    if (hidden) localStorage.setItem(UNRATED_END_HINT_KEY, '1');
    else localStorage.removeItem(UNRATED_END_HINT_KEY);
  } catch {
    // This browser session still has the in-memory checkbox.
  }
}
export const REVEAL_PROGRESS_INTERVAL_MS = 20;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isContestUuid(value: string | undefined | null): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

export interface JudgingContestCandidate {
  id: string;
  tenantId: string;
  status: string;
  updatedAt: string;
}

export function selectJudgingContestId(input: {
  contests: JudgingContestCandidate[];
  tenantKeys: string[];
  preferredContestId?: string | null;
}): string | null {
  const keys = new Set(input.tenantKeys.filter((key) => key.length > 0));
  const open = input.contests
    .filter(
      (contest) =>
        keys.has(contest.tenantId) &&
        isContestUuid(contest.id) &&
        (contest.status === 'ACTIVE' || contest.status === 'JUDGING')
    )
    .sort((left, right) => {
      const rank = (status: string) => (status === 'ACTIVE' ? 0 : 1);
      const byStatus = rank(left.status) - rank(right.status);
      if (byStatus !== 0) return byStatus;
      return right.updatedAt.localeCompare(left.updatedAt);
    });

  if (open.length > 0) return open[0].id;
  if (isContestUuid(input.preferredContestId)) return input.preferredContestId;
  return null;
}

export function resolveAutoAdvanceDelayMs(value: number | null | undefined): number {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) {
    return value;
  }
  return DEFAULT_AUTO_ADVANCE_DELAY_MS;
}

export function revealStepCount(
  delayMs: number,
  intervalMs: number = REVEAL_PROGRESS_INTERVAL_MS
): number {
  return delayMs / intervalMs;
}

export function mapRateResult(input: {
  videoId: string;
  userRating: number;
  previousScore: number;
  newScore: number;
  delta: number;
  totalVotes: number;
}): AggregatedScoreResult {
  return {
    videoId: input.videoId,
    previousScore: input.previousScore,
    previousVotes: Math.max(0, input.totalVotes - 1),
    userRating: input.userRating,
    newCommunityScore: input.newScore,
    newTotalVotes: input.totalVotes,
    delta: input.delta,
  };
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false;
  const element = target as { tagName?: string; isContentEditable?: boolean };
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') return true;
  return element.isContentEditable === true;
}

const GUEST_RATED_KEY = 'cos_guest_rated_submission_ids';

export function hasLocalGuestRating(videoId: string): boolean {
  try {
    const raw = localStorage.getItem(GUEST_RATED_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(ids) && ids.includes(videoId);
  } catch {
    return false;
  }
}

export function rememberLocalGuestRating(videoId: string): void {
  try {
    const raw = localStorage.getItem(GUEST_RATED_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    const next = Array.isArray(ids) ? ids : [];
    if (!next.includes(videoId)) next.push(videoId);
    localStorage.setItem(GUEST_RATED_KEY, JSON.stringify(next));
  } catch {
    // The server remains the source of truth if storage is unavailable.
  }
}

export function queueItemToVideo(item: {
  id: string;
  contestId?: string;
  contestStatus?: string;
  ratingOpen?: boolean;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  tags: string[];
  communityScore: number;
  totalVotes: number;
  viewerRating?: number | null;
  category: string | null;
  creator: { name: string; avatarUrl?: string | null };
}): ContestVideoItem {
  return {
    id: item.id,
    contestId: item.contestId,
    contestStatus: item.contestStatus,
    ratingOpen: item.ratingOpen,
    title: item.title,
    creatorName: item.creator.name,
    creatorAvatarUrl: item.creator.avatarUrl || undefined,
    videoUrl: item.videoUrl,
    thumbnailUrl: item.thumbnailUrl ?? undefined,
    category: item.category ?? '',
    communityScore: item.communityScore,
    totalVotes: item.totalVotes,
    viewerRating: item.viewerRating ?? null,
    description: item.description ?? '',
    tags: item.tags,
    durationSeconds: item.durationSeconds,
  };
}

/**
 * Existing empty-queue showcase (M08-P04-T06).
 * This card is not a submission and must not be rated.
 */
export function emptyQueueFallback(input: {
  brandName?: string;
  brandSlug?: string;
  logoUrl?: string;
}): ContestVideoItem {
  const name = input.brandName || 'Brand';
  const slug = input.brandSlug || 'brand';
  return {
    id: `empty-${slug}`,
    title: `${name} Showcase Showcase #01`,
    creatorName: `${name} Team`,
    creatorHandle: `@${slug}_official`,
    creatorAvatarUrl: input.logoUrl || '/logo/woofskis_logo_with_dog_transparent.png',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=600&auto=format&fit=crop&q=80',
    videoUrl:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    category: 'Official Showcase',
    communityScore: 4.8,
    totalVotes: 190,
    description: `Official premier video tournament for ${name}.`,
    tags: [`#${name}`, '#OfficialContest'],
    durationSeconds: 15,
  };
}
