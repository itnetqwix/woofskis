export type TimeframeFilter = 'ALL_TIME' | 'MONTHLY' | 'WEEKLY' | 'DAILY';

export type RankTrend = 'UP' | 'DOWN' | 'SAME' | 'NEW';

export type PodiumTier = 'GOLD' | 'SILVER' | 'BRONZE';

export interface PrizeTierInfo {
  tier: PodiumTier | string;
  amount: string; // e.g. "$12,500"
  numericAmount: number;
  label: string; // e.g. "1st Place Champion"
  badgeColor: string;
  glowColor: string;
}

export interface LeaderboardItem {
  id: string; // submission id
  rank: number;
  previousRank?: number;
  rankChange?: number; // e.g. +2, -1, 0
  trend: RankTrend;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  category: string;
  contestId: string;
  contestName: string;
  creatorId?: string;
  creatorName: string;
  creatorHandle: string;
  creatorAvatarUrl: string;
  creatorVerified?: boolean;
  communityScore: number; // 0-5.0
  totalVotes: number;
  submittedAt: string; // ISO date
  prizeTier?: PrizeTierInfo;
  description?: string;
  tags?: string[];
  viewCount?: number;
  scoreBreakdown?: {
    humorCreativity: number;
    visualQuality: number;
    audioPacing: number;
    viralPotential: number;
  };
}

export interface PrizeDistributionItem {
  rank: number;
  placeLabel: string;
  prize: string;
  percentage: string;
  tier: PodiumTier | string;
  badgeColor: string;
}

export interface ContestLeaderboardMetadata {
  contestId: string;
  title: string;
  season: string;
  tagline: string;
  description?: string;
  bannerUrl?: string | null;
  timezone?: string;
  endDate?: string;
  votingClosesAt?: string | null;
  status: 'ACTIVE' | 'CONCLUDED' | 'JUDGING' | string;
  totalPrizePool: string;
  totalPrizeAmount: number;
  currency: string;
  totalSubmissions: number;
  totalVotesCast: number;
  activeContendersCount: number;
  deadline: string; // ISO date string
  startDate: string;
  consensusConfidence: number; // e.g. 98.4%
  prizeDistribution: PrizeDistributionItem[];
}

export type LeaderboardViewMode = 'podium_table' | 'full_table';
