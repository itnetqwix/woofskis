import { http, type ApiResponse } from './api-client';

/**
 * Contest HTTP helpers (M05-P04-T01).
 *
 * Paths are relative to axios `baseURL` (`NEXT_PUBLIC_API_BASE_URL`).
 * Returns the frozen envelope. Does not unwrap `data`.
 *
 * Auth is the existing Bearer interceptor (`cos_auth_token`).
 * 401 handling stays in `src/lib/axios.ts`.
 *
 * No submission, presign, queue, rating, or leaderboard helpers (M06+).
 * No delete or duplicate helper: those operations are NOT SPECIFIED.
 */

export const CONTEST_API_PATHS = {
  collection: '/contests',
  bannerPresign: '/contests/banners/presign',
  active: '/contests/active',
  viewable: '/contests/viewable',
  creatorCollection: '/creator/contests',
  creatorById: (id: string) => `/creator/contests/${encodeURIComponent(id)}`,
  byId: (id: string) => `/contests/${encodeURIComponent(id)}`,
  scheduleJudging: (id: string) => `/contests/${encodeURIComponent(id)}/schedule-judging`,
} as const;

export const API_CONTEST_STATUSES = [
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'JUDGING',
  'COMPLETED',
  'ARCHIVED',
  'DELETED',
] as const;

export type ApiContestStatus = (typeof API_CONTEST_STATUSES)[number];

const NEXT_STATUS: Record<ApiContestStatus, ApiContestStatus | null> = {
  DRAFT: 'ACTIVE',
  SCHEDULED: 'ACTIVE',
  ACTIVE: 'JUDGING',
  JUDGING: 'COMPLETED',
  COMPLETED: 'ARCHIVED',
  ARCHIVED: null,
  DELETED: null,
};

export function isApiContestStatus(value: string): value is ApiContestStatus {
  return (API_CONTEST_STATUSES as readonly string[]).includes(value);
}

/** Documented one-step transition. Null when the contest is ARCHIVED. */
export function nextContestStatus(status: string): ApiContestStatus | null {
  if (!isApiContestStatus(status)) return null;
  return NEXT_STATUS[status];
}

export interface ApiContestCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface ApiContest {
  id: string;
  categoryId: string | null;
  category: ApiContestCategory | null;
  title: string;
  description: string;
  tagline: string | null;
  bannerUrl: string | null;
  bannerObjectKey?: string | null;
  thumbnailUrl: string | null;
  status: ApiContestStatus;
  timezone?: string | null;
  startDate: string;
  endDate: string;
  votingClosesAt?: string | null;
  scheduledJudgingAt?: string | null;
  originalTagline?: string | null;
  prizeSummary: string | null;
  rules: string | string[] | null;
  autoAdvanceDelayMs: number;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContestRequest {
  categoryId?: string;
  category?: { name: string; slug?: string; description?: string };
  title: string;
  description: string;
  tagline?: string | null;
  bannerUrl?: string | null;
  bannerObjectKey?: string | null;
  thumbnailUrl?: string | null;
  timezone?: string;
  startDate: string;
  endDate: string;
  votingClosesAt?: string | null;
  prizeSummary?: string | null;
  rules?: string | string[] | null;
  autoAdvanceDelayMs?: number;
}

export interface UpdateContestRequest {
  title?: string;
  description?: string;
  tagline?: string | null;
  bannerUrl?: string | null;
  bannerObjectKey?: string | null;
  thumbnailUrl?: string | null;
  timezone?: string;
  startDate?: string;
  endDate?: string;
  votingClosesAt?: string | null;
  prizeSummary?: string | null;
  rules?: string | string[] | null;
  autoAdvanceDelayMs?: number;
  status?: ApiContestStatus;
  categoryId?: string | null;
  category?: { name: string; slug?: string; description?: string } | null;
}

export interface ListContestsQuery {
  tenantId?: string;
  status?: ApiContestStatus;
  category?: string;
}

export function listContests(query: ListContestsQuery = {}): Promise<ApiResponse<ApiContest[]>> {
  return http.get<ApiContest[]>(CONTEST_API_PATHS.collection, { params: query });
}

/** Public ACTIVE contests for this deployment. No organization parameter. */
export function listDeploymentActiveContests(): Promise<ApiResponse<ApiContest[]>> {
  return http.get<ApiContest[]>(CONTEST_API_PATHS.active);
}

export function listViewableContests(): Promise<ApiResponse<ApiContest[]>> {
  return http.get<ApiContest[]>(CONTEST_API_PATHS.viewable);
}

export function listCreatorContests(): Promise<ApiResponse<ApiContest[]>> {
  return http.get<ApiContest[]>(CONTEST_API_PATHS.creatorCollection);
}

export function getCreatorContest(id: string): Promise<ApiResponse<ApiContest>> {
  return http.get<ApiContest>(CONTEST_API_PATHS.creatorById(id));
}

export function deleteContest(id: string): Promise<ApiResponse<{ id: string }>> {
  return http.delete<{ id: string }>(CONTEST_API_PATHS.byId(id));
}

export function getContest(id: string): Promise<ApiResponse<ApiContest>> {
  return http.get<ApiContest>(CONTEST_API_PATHS.byId(id));
}

export interface PresignContestBannerResponse {
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
  method: 'PUT';
}

export function presignContestBanner(body: {
  contentType: string;
  fileSizeBytes: number;
}): Promise<ApiResponse<PresignContestBannerResponse>> {
  return http.post<PresignContestBannerResponse>(CONTEST_API_PATHS.bannerPresign, body);
}

export function createContest(body: CreateContestRequest): Promise<ApiResponse<ApiContest>> {
  return http.post<ApiContest>(CONTEST_API_PATHS.collection, body);
}

export function updateContest(
  id: string,
  body: UpdateContestRequest
): Promise<ApiResponse<ApiContest>> {
  return http.patch<ApiContest>(CONTEST_API_PATHS.byId(id), body);
}

export function scheduleContestJudging(
  id: string,
  taglineConfirmation: string
): Promise<ApiResponse<ApiContest>> {
  return http.post<ApiContest>(CONTEST_API_PATHS.scheduleJudging(id), {
    taglineConfirmation,
  });
}
