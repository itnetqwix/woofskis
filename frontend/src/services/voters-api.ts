import { http, type ApiResponse } from './api-client';

export interface ApiVoter {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  rating: number;
  createdAt: string;
}

export interface ApiVoterPage {
  items: ApiVoter[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function listVoters(submissionId: string, page = 1): Promise<ApiResponse<ApiVoterPage>> {
  const query = new URLSearchParams({ page: String(page), limit: '20' });
  return http.get<ApiVoterPage>(
    `/submissions/${encodeURIComponent(submissionId)}/voters?${query.toString()}`
  );
}
