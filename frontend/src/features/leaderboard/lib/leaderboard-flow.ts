import { ContestLeaderboardMetadata, LeaderboardItem } from '@/types/leaderboard';
import { ApiLeaderboardContest, ApiLeaderboardItem } from '@/services/leaderboard-api';
import { PRIZE_TIER_CONFIG } from '@/constants/mock-leaderboard-data';
import { isUuid } from '@/lib/is-uuid';

export { isUuid };

export interface SelectContestParams {
  contests: Array<{ id: string; tenantId?: string; status?: string; updatedAt?: string }>;
  tenantKeys: string[];
  preferredContestId?: string | null;
}

export function selectLeaderboardContestId({
  contests,
  tenantKeys,
  preferredContestId,
}: SelectContestParams): string | null {
  if (preferredContestId && isUuid(preferredContestId)) {
    return preferredContestId;
  }
  const keys = tenantKeys.map((k) => k.trim().toLowerCase()).filter(Boolean);
  const matching = contests.filter((c) => {
    const tid = (c.tenantId || '').trim().toLowerCase();
    return keys.includes(tid);
  });

  const active = matching.find((c) => c.status === 'ACTIVE' && isUuid(c.id));
  if (active) return active.id;

  const judging = matching.find((c) => c.status === 'JUDGING' && isUuid(c.id));
  if (judging) return judging.id;

  const completed = matching.find(
    (c) => (c.status === 'COMPLETED' || c.status === 'ARCHIVED') && isUuid(c.id)
  );
  if (completed) return completed.id;

  const anyUuid = matching.find((c) => isUuid(c.id));
  if (anyUuid) return anyUuid.id;

  return null;
}

export function apiItemToLeaderboardItem(
  item: ApiLeaderboardItem,
  rankOverride?: number
): LeaderboardItem {
  const rank = rankOverride ?? item.rank;
  const prizeTier = PRIZE_TIER_CONFIG[rank];
  const safeName = item.creator?.name || 'Creator';
  const handle = '@' + safeName.toLowerCase().replace(/[^a-z0-9]/g, '');

  return {
    id: item.id,
    rank,
    trend: 'SAME',
    rankChange: 0,
    title: item.title,
    videoUrl: item.videoUrl,
    thumbnailUrl: item.thumbnailUrl || '',
    durationSeconds: item.durationSeconds,
    category: item.tags?.[0] || '',
    contestId: item.contestId,
    contestName: item.contestTitle || 'Contest',
    creatorId: item.creator?.id,
    creatorName: safeName,
    creatorHandle: handle,
    creatorAvatarUrl: item.creator?.avatarUrl || '',
    creatorVerified: false,
    communityScore: item.communityScore,
    totalVotes: item.totalVotes,
    submittedAt: item.createdAt,
    description: item.description ?? undefined,
    tags: item.tags || [],
    prizeTier,
  };
}

export function buildContestMetadata(
  contest: ApiLeaderboardContest,
  stats?: { totalEntries: number; totalVotes: number; averageScore: number }
): ContestLeaderboardMetadata {
  const isClosed = contest.status === 'COMPLETED' || contest.status === 'ARCHIVED';
  const prize = contest.prizeSummary || '';

  return {
    contestId: contest.id,
    title: contest.title || 'Contest',
    season: contest.category?.name || '',
    tagline: contest.tagline || '',
    description: contest.description || '',
    bannerUrl: contest.bannerUrl || null,
    timezone: contest.timezone || 'Asia/Kolkata',
    status: isClosed ? 'CONCLUDED' : contest.status || 'ACTIVE',
    totalPrizePool: prize,
    totalPrizeAmount: 0,
    currency: '',
    totalSubmissions: stats?.totalEntries ?? 0,
    totalVotesCast: stats?.totalVotes ?? 0,
    activeContendersCount: stats?.totalEntries ?? 0,
    deadline: contest.votingClosesAt || contest.endDate || '',
    startDate: contest.startDate || '',
    endDate: contest.endDate || '',
    votingClosesAt: contest.votingClosesAt || null,
    consensusConfidence: 0,
    prizeDistribution: [],
  };
}
