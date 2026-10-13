import { http, type ApiResponse } from './api-client';

/**
 * Judging HTTP helpers (M08-P04-T01).
 *
 * Paths are relative to axios `baseURL`. Returns the frozen envelope.
 * Queue is public. Rate auth is optional: the shared client attaches a
 * Bearer token when one is stored. Anonymous visitors omit it.
 * VIEWER tokens are accepted. Other roles are rejected by the API.
 *
 * voterFingerprint is optional. No fingerprint is generated here.
 * Mute preference is not sent.
 */

export const JUDGING_API_PATHS = {
  queue: (contestId: string) => `/contests/${encodeURIComponent(contestId)}/queue`,
  rate: (contestId: string, videoId: string) =>
    `/contests/${encodeURIComponent(contestId)}/videos/${encodeURIComponent(videoId)}/rate`,
} as const;

export interface ApiJudgingCreator {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface ApiJudgingQueueItem {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  tags: string[];
  communityScore: number;
  totalVotes: number;
  viewerRating?: number | null;
  status: 'APPROVED';
  category: string | null;
  creator: ApiJudgingCreator;
  createdAt: string;
}

export interface ApiJudgingQueue {
  contestId: string;
  status: string;
  ratingOpen: boolean;
  autoAdvanceDelayMs: number;
  items: ApiJudgingQueueItem[];
}

export interface ApiRateResult {
  previousScore: number;
  newScore: number;
  delta: number;
  totalVotes: number;
  ratingId?: string;
  viewerRating?: number;
}

export interface RateSubmissionRequest {
  rating: number;
  voterFingerprint?: string;
}

export function getJudgingQueue(contestId: string): Promise<ApiResponse<ApiJudgingQueue>> {
  return http.get<ApiJudgingQueue>(JUDGING_API_PATHS.queue(contestId));
}

export function rateSubmission(
  contestId: string,
  videoId: string,
  body: RateSubmissionRequest
): Promise<ApiResponse<ApiRateResult>> {
  return http.post<ApiRateResult>(JUDGING_API_PATHS.rate(contestId, videoId), body);
}
