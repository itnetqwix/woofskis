import { http, type ApiResponse } from './api-client';

/**
 * Submission HTTP helpers (M06-P04-T01).
 *
 * Paths are relative to axios `baseURL`. Returns the frozen envelope.
 * Video bytes are never sent through Fastify — only metadata.
 * Auth is the existing Bearer interceptor. 401 handling stays in axios.
 */

export const SUBMISSION_API_PATHS = {
  presign: '/submissions/presign',
  complete: '/submissions/complete',
  me: '/submissions/me',
  byId: (id: string) => `/submissions/${encodeURIComponent(id)}`,
} as const;

export const API_SUBMISSION_STATUSES = [
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'FLAGGED',
] as const;

export type ApiSubmissionStatus = (typeof API_SUBMISSION_STATUSES)[number];

export interface ApiSubmissionContest {
  id: string;
  title: string;
  status: string;
  category: { id: string; name: string; slug: string } | null;
}

export interface ApiSubmission {
  id: string;
  contestId: string;
  creatorId: string;
  title: string;
  description: string | null;
  videoUrl: string;
  objectKey: string;
  thumbnailUrl: string | null;
  durationSeconds: number;
  status: ApiSubmissionStatus;
  rejectionReason?: string | null;
  moderatedById?: string | null;
  moderatedAt?: string | null;
  tags: string[];
  communityScore: number;
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
  contest?: ApiSubmissionContest;
}

export interface PresignSubmissionRequest {
  contestId: string;
  contentType: 'video/mp4' | 'video/webm' | 'video/quicktime';
  fileSizeBytes: number;
  durationSeconds: number;
}

export interface PresignSubmissionResponse {
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
  method: 'PUT';
  /** Presigned PUT for the image/jpeg poster frame. Absent for legacy keys. */
  thumbnail?: Omit<PresignSubmissionResponse, 'thumbnail'> | null;
}

export interface CompleteSubmissionRequest {
  contestId: string;
  objectKey: string;
  title: string;
  description?: string | null;
  durationSeconds: number;
  tags?: string[];
  thumbnailUrl?: string | null;
}

export function presignSubmission(
  body: PresignSubmissionRequest
): Promise<ApiResponse<PresignSubmissionResponse>> {
  return http.post<PresignSubmissionResponse>(SUBMISSION_API_PATHS.presign, body);
}

export function completeSubmission(
  body: CompleteSubmissionRequest
): Promise<ApiResponse<ApiSubmission>> {
  return http.post<ApiSubmission>(SUBMISSION_API_PATHS.complete, body);
}

export function listMySubmissions(): Promise<ApiResponse<ApiSubmission[]>> {
  return http.get<ApiSubmission[]>(SUBMISSION_API_PATHS.me);
}

export function getSubmission(id: string): Promise<ApiResponse<ApiSubmission>> {
  return http.get<ApiSubmission>(SUBMISSION_API_PATHS.byId(id));
}

export interface DeletedSubmission {
  id: string;
  deleted: boolean;
  deletedAt: string;
}

export function deleteMySubmission(id: string): Promise<ApiResponse<DeletedSubmission>> {
  return http.delete<DeletedSubmission>(SUBMISSION_API_PATHS.byId(id));
}
