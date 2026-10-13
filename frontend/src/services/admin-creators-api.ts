import { http, type ApiResponse } from './api-client';

export interface ApiCreatorSummary {
  totalCreators: number;
  activeCreators: number;
  blockedCreators: number;
  totalVideos: number;
  approvedVideos: number;
  pendingVideos: number;
  rejectedVideos: number;
  flaggedVideos: number;
  underModerationVideos: number;
}

export interface ApiPagination {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiAdminCreator {
  id: string;
  name: string;
  email: string;
  role: string;
  accountStatus: 'ACTIVE' | 'BLOCKED';
  createdAt: string;
  lastActivityAt: string | null;
  totalVideos: number;
  approvedVideos: number;
  pendingVideos: number;
  rejectedVideos: number;
  flaggedVideos: number;
  contestsParticipated: number;
  submissionCount: number;
}

export interface ApiAdminCreatorList {
  totalCreators: number;
  summary: ApiCreatorSummary;
  creators: ApiAdminCreator[];
  pagination: ApiPagination;
}

export interface ApiDeletedBy {
  id: string;
  name: string;
}

export function creatorDeletionNote(video: {
  deletedAt?: string | null;
  deletedBy?: { name?: string | null } | null;
}): string | null {
  if (!video.deletedAt) return null;
  const when = new Date(video.deletedAt);
  const stamp = Number.isNaN(when.getTime()) ? video.deletedAt : when.toLocaleString();
  return video.deletedBy?.name
    ? `Deleted by ${video.deletedBy.name} · ${stamp}`
    : `Deleted · ${stamp}`;
}

export interface ApiAdminCreatorVideo {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  updatedAt: string | null;
  contestId: string;
  contestTitle: string;
  contestStatus: string;
  communityScore: number;
  totalVotes: number;
  durationSeconds: number | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  deletedAt?: string | null;
  deletedBy?: ApiDeletedBy | null;
}

export interface ApiCreatorWarning {
  id: string;
  reason: string;
  createdAt: string;
  issuedBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApiCreatorStats {
  totalVideos: number;
  approvedVideos: number;
  pendingVideos: number;
  rejectedVideos: number;
  flaggedVideos: number;
  underModerationVideos: number;
  contestsParticipated: number;
  totalRatingsReceived: number;
  totalComments: number;
}

export interface ApiAdminCreatorProfile {
  creator: {
    id: string;
    name: string;
    email: string;
    role: string;
    accountStatus: 'ACTIVE' | 'BLOCKED';
    createdAt: string;
    lastActivityAt: string | null;
    avatarUrl?: string | null;
  };
  stats: ApiCreatorStats;
  warnings: ApiCreatorWarning[];
  submissions: ApiAdminCreatorVideo[];
}

export interface ApiCreatorContestParticipation {
  contestId: string;
  title: string;
  status: string;
  submissionCount: number;
  firstSubmissionAt: string;
  latestSubmissionAt: string;
  submissions: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string | null;
    communityScore: number;
    totalVotes: number;
    deletedAt?: string | null;
    deletedBy?: ApiDeletedBy | null;
  }>;
}

export interface ApiCreatorActivity {
  id: string;
  action: string;
  description: string | null;
  relatedSubmissionId: string | null;
  relatedContestId: string | null;
  relatedSubmissionTitle: string | null;
  relatedContestTitle: string | null;
  performedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  createdAt: string;
}

export interface ApiDeletedSubmission {
  id: string;
  deleted: boolean;
  mediaObjectRetained: boolean;
}

export interface ApiContestParticipant {
  id: string;
  name: string;
  email: string;
  accountStatus: 'ACTIVE' | 'BLOCKED';
  submissionCount: number;
  firstSubmissionAt: string | null;
  latestSubmissionAt: string | null;
  submissions: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    updatedAt: string | null;
    communityScore: number;
    totalVotes: number;
    deletedAt?: string | null;
    deletedBy?: ApiDeletedBy | null;
  }>;
}

export interface ListAdminCreatorsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'ACTIVE' | 'BLOCKED';
  contestId?: string;
}

export function listAdminCreators(
  query: ListAdminCreatorsQuery = {}
): Promise<ApiResponse<ApiAdminCreatorList>> {
  return http.get<ApiAdminCreatorList>('/admin/creators', { params: query });
}

export function getAdminCreator(creatorId: string): Promise<ApiResponse<ApiAdminCreatorProfile>> {
  return http.get<ApiAdminCreatorProfile>(`/admin/creators/${encodeURIComponent(creatorId)}`);
}

export function listAdminCreatorContests(
  creatorId: string
): Promise<ApiResponse<{ creatorId: string; contests: ApiCreatorContestParticipation[] }>> {
  return http.get(`/admin/creators/${encodeURIComponent(creatorId)}/contests`);
}

export function listAdminCreatorSubmissions(
  creatorId: string,
  query: { page?: number; limit?: number } = {}
): Promise<ApiResponse<{ items: ApiAdminCreatorVideo[]; pagination: ApiPagination }>> {
  return http.get(`/admin/creators/${encodeURIComponent(creatorId)}/submissions`, {
    params: query,
  });
}

export function listAdminCreatorActivity(
  creatorId: string,
  query: { page?: number; limit?: number } = {}
): Promise<ApiResponse<{ items: ApiCreatorActivity[]; pagination: ApiPagination }>> {
  return http.get(`/admin/creators/${encodeURIComponent(creatorId)}/activity`, { params: query });
}

export function warnAdminCreator(
  creatorId: string,
  reason: string
): Promise<ApiResponse<ApiCreatorWarning & { creatorId: string }>> {
  return http.post(`/admin/creators/${encodeURIComponent(creatorId)}/warnings`, { reason });
}

export function setAdminCreatorStatus(
  creatorId: string,
  accountStatus: 'ACTIVE' | 'BLOCKED'
): Promise<ApiResponse<{ id: string; accountStatus: 'ACTIVE' | 'BLOCKED'; changed: boolean }>> {
  return http.patch(`/admin/creators/${encodeURIComponent(creatorId)}/status`, { accountStatus });
}

export function listContestParticipants(
  contestId: string,
  query: { page?: number; limit?: number } = {}
): Promise<
  ApiResponse<{
    contest: { id: string; title: string; status: string };
    participatingCreatorCount: number;
    creators: ApiContestParticipant[];
    pagination: ApiPagination;
  }>
> {
  return http.get(`/admin/contests/${encodeURIComponent(contestId)}/participants`, {
    params: query,
  });
}

export function deleteAdminSubmission(
  submissionId: string
): Promise<ApiResponse<ApiDeletedSubmission>> {
  return http.delete<ApiDeletedSubmission>(
    `/admin/submissions/${encodeURIComponent(submissionId)}`
  );
}
