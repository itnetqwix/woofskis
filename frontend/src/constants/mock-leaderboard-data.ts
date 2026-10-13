import { ContestLeaderboardMetadata, PrizeTierInfo } from '@/types/leaderboard';

/**
 * Podium presentation only. Prize amounts are not returned by
 * GET /contests/:id/leaderboard (payout is out of MVP). Ranked rows are not
 * stored here.
 */
const futureDeadline = new Date(
  Date.now() + 3 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000 + 45 * 60 * 1000
).toISOString();

export const PRIZE_TIER_CONFIG: Record<number, PrizeTierInfo> = {
  1: {
    tier: 'GOLD',
    amount: '$12,500',
    numericAmount: 12500,
    label: '1st Place Champion',
    badgeColor: 'border-amber-400/40 bg-amber-400/15 text-amber-300 ring-amber-400/30',
    glowColor: 'from-amber-500/20 via-yellow-500/10 to-transparent',
  },
  2: {
    tier: 'SILVER',
    amount: '$7,500',
    numericAmount: 7500,
    label: '2nd Place Runner-Up',
    badgeColor: 'border-slate-300/40 bg-slate-300/15 text-slate-200 ring-slate-300/30',
    glowColor: 'from-slate-400/20 via-slate-300/10 to-transparent',
  },
  3: {
    tier: 'BRONZE',
    amount: '$5,000',
    numericAmount: 5000,
    label: '3rd Place Finalist',
    badgeColor: 'border-amber-700/40 bg-amber-700/15 text-amber-500 ring-amber-700/30',
    glowColor: 'from-amber-700/20 via-orange-800/10 to-transparent',
  },
};

export const ACTIVE_CONTEST_LEADERBOARD_METADATA: ContestLeaderboardMetadata = {
  contestId: 'contest_rip_01',
  title: 'Woofskis Pet Video Challenge',
  season: 'Season 01: Summer Horizon',
  tagline:
    'Real-time community consensus leaderboard for viral comedy, VFX humor, and high-impact short-form videos.',
  status: 'ACTIVE',
  totalPrizePool: '$25,000 USD',
  totalPrizeAmount: 25000,
  currency: 'USD',
  totalSubmissions: 428,
  totalVotesCast: 14820,
  activeContendersCount: 64,
  deadline: futureDeadline,
  startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  consensusConfidence: 98.4,
  prizeDistribution: [
    {
      rank: 1,
      placeLabel: '1st Place (Gold)',
      prize: '$12,500 USD',
      percentage: '50%',
      tier: 'GOLD',
      badgeColor: 'border-amber-500/40 text-amber-400 bg-amber-500/15',
    },
    {
      rank: 2,
      placeLabel: '2nd Place (Silver)',
      prize: '$7,500 USD',
      percentage: '30%',
      tier: 'SILVER',
      badgeColor: 'border-slate-300/40 text-slate-300 bg-slate-300/15',
    },
    {
      rank: 3,
      placeLabel: '3rd Place (Bronze)',
      prize: '$5,000 USD',
      percentage: '20%',
      tier: 'BRONZE',
      badgeColor: 'border-amber-700/40 text-amber-600 bg-amber-700/15',
    },
  ],
};
