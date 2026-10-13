import { http, type ApiResponse } from './api-client';

/**
 * Comments are stored on a submission.
 * GET is public. POST requires an authenticated session.
 * Guest comment authorship is NOT SPECIFIED and is not sent anonymously.
 */

export interface ApiComment {
  id: string;
  submissionId: string;
  body: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export function listComments(submissionId: string): Promise<ApiResponse<ApiComment[]>> {
  return http.get<ApiComment[]>(`/submissions/${encodeURIComponent(submissionId)}/comments`);
}

export function createComment(
  submissionId: string,
  body: string
): Promise<ApiResponse<ApiComment>> {
  return http.post<ApiComment>(`/submissions/${encodeURIComponent(submissionId)}/comments`, {
    body,
  });
}
