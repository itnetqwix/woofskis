import { http, type ApiResponse } from './api-client';
import type { ApiSubmissionStatus } from './submissions-api';

/**
 * Moderation HTTP helpers (M07-P03-T01).
 *
 * Paths are relative to axios `baseURL`. Returns the frozen envelope.
 * Auth is the existing Bearer interceptor.
 *
 * Flag, unflag, and bulk routes are not called: they are not in the M07 API list.
 */

export const MODERATION_API_PATHS = {
  queue: '/admin/moderation/queue',
  auditLogs: '/admin/moderation/audit-logs',
  approve: (id: string) => `/admin/submissions/${encodeURIComponent(id)}/approve`,
  reject: (id: string) => `/admin/submissions/${encodeURIComponent(id)}/reject`,
} as const;

export interface ApiModerationContest {
  id: string;
  title: string;
  status: string;
  category: { id: string; name: string; slug: string } | null;
}

export interface ApiModerationCreator {
  id: string;
  name: string;
}

export interface ApiModerationSubmission {
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
  rejectionReason: string | null;
  moderatedById: string | null;
  moderatedAt: string | null;
  tags: string[];
  categoryId?: string | null;
  otherCategoryLabel?: string | null;
  videoCategory?: { id: string; name: string; slug: string; isActive?: boolean } | null;
  communityScore: number;
  totalVotes: number;
  createdAt: string;
  updatedAt: string;
  contest?: ApiModerationContest;
  creator?: ApiModerationCreator;
}

export type ApiAuditAction = 'APPROVE' | 'REJECT' | 'FLAG' | 'ISSUE_WARNING' | 'SUSPEND_CREATOR';

export interface ApiAuditLog {
  id: string;
  submissionId: string | null;
  actorId: string;
  action: ApiAuditAction;
  reason: string | null;
  metadata: {
    previousStatus?: string;
    newStatus?: string;
    reasonCode?: string;
  } | null;
  createdAt: string;
  actor: { id: string; name: string };
  submission: { id: string; title: string; creatorName: string | null } | null;
}

export interface RejectSubmissionRequest {
  reason: string;
  reasonCode?: string;
}

export function listModerationQueue(): Promise<ApiResponse<ApiModerationSubmission[]>> {
  return http.get<ApiModerationSubmission[]>(MODERATION_API_PATHS.queue);
}

export function listModerationAuditLogs(): Promise<ApiResponse<ApiAuditLog[]>> {
  return http.get<ApiAuditLog[]>(MODERATION_API_PATHS.auditLogs);
}

export function approveModerationSubmission(
  id: string,
  note?: string
): Promise<ApiResponse<ApiModerationSubmission>> {
  return http.post<ApiModerationSubmission>(MODERATION_API_PATHS.approve(id), note ? { note } : {});
}

export function rejectModerationSubmission(
  id: string,
  body: RejectSubmissionRequest
): Promise<ApiResponse<ApiModerationSubmission>> {
  return http.post<ApiModerationSubmission>(MODERATION_API_PATHS.reject(id), body);
}
