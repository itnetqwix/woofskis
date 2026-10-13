import { http, type ApiResponse } from './api-client';

/**
 * Leaderboard HTTP helpers (M09-P02-T01).
 *
 * Paths are relative to axios `baseURL`. Returns the frozen envelope.
 * GET /contests/:id/leaderboard is public.
 */

export const LEADERBOARD_API_PATHS = {
  leaderboard: (contestId: string) => `/contests/${encodeURIComponent(contestId)}/leaderboard`,
} as const;

export interface ApiLeaderboardCreator {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface ApiLeaderboardItem {
  rank: number;
  id: string;
  contestId: string;
  contestTitle: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  tags: string[];
  communityScore: number;
  totalVotes: number;
  createdAt: string;
  creator: ApiLeaderboardCreator;
}

export interface ApiLeaderboardContest {
  id: string;
  title: string;
  description?: string;
  tagline?: string | null;
  bannerUrl?: string | null;
  status: string;
  timezone?: string | null;
  startDate?: string;
  endDate?: string;
  votingClosesAt?: string | null;
  prizeSummary?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ApiLeaderboardData {
  contest: ApiLeaderboardContest;
  totalEntries: number;
  totalVotes: number;
  averageScore: number;
  items: ApiLeaderboardItem[];
  podium: ApiLeaderboardItem[];
}

export interface GetLeaderboardParams {
  category?: string;
  timeframe?: string;
}

export function getLeaderboard(
  contestId: string,
  params?: GetLeaderboardParams
): Promise<ApiResponse<ApiLeaderboardData>> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== 'ALL') {
    query.set('category', params.category);
  }
  if (params?.timeframe && params.timeframe !== 'ALL_TIME') {
    query.set('timeframe', params.timeframe);
  }
  const queryString = query.toString();
  const path = `${LEADERBOARD_API_PATHS.leaderboard(contestId)}${queryString ? `?${queryString}` : ''}`;
  return http.get<ApiLeaderboardData>(path);
}
