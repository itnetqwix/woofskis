import { http, type ApiResponse } from './api-client';

export const OTHER_VIDEO_CATEGORY = '__other__';

export const VIDEO_CATEGORY_API_PATHS = {
  active: '/video-categories',
  admin: '/admin/video-categories',
  adminById: (id: string) => `/admin/video-categories/${encodeURIComponent(id)}`,
} as const;

export interface VideoCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  submissionCount: number;
  contestCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoCategoryPage {
  items: VideoCategory[];
  pagination: {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface VideoCategoryWrite {
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

let activeCache: { at: number; data: VideoCategory[] } | null = null;
let activeInflight: Promise<VideoCategory[]> | null = null;

export function invalidateActiveVideoCategories(): void {
  activeCache = null;
  activeInflight = null;
}

export async function listActiveVideoCategories(force = false): Promise<VideoCategory[]> {
  if (!force && activeCache && Date.now() - activeCache.at < 15000) {
    return activeCache.data;
  }
  if (!force && activeInflight) return activeInflight;

  activeInflight = http
    .get<VideoCategory[]>(VIDEO_CATEGORY_API_PATHS.active)
    .then((envelope) => {
      if (!envelope.success || !Array.isArray(envelope.data)) {
        throw new Error(envelope.message || 'Could not load video categories');
      }
      const data = envelope.data.filter((category) => category.isActive);
      activeCache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      activeInflight = null;
    });

  return activeInflight;
}

export function listAdminVideoCategories(query: {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
}): Promise<ApiResponse<VideoCategoryPage>> {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.status && query.status !== 'all') params.set('status', query.status);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  const queryString = params.toString();
  const suffix = queryString ? `?${queryString}` : '';
  return http.get<VideoCategoryPage>(`${VIDEO_CATEGORY_API_PATHS.admin}${suffix}`);
}

export function createVideoCategory(
  body: VideoCategoryWrite
): Promise<ApiResponse<VideoCategory>> {
  invalidateActiveVideoCategories();
  return http.post<VideoCategory>(VIDEO_CATEGORY_API_PATHS.admin, body);
}

export function updateVideoCategory(
  id: string,
  body: VideoCategoryWrite
): Promise<ApiResponse<VideoCategory>> {
  invalidateActiveVideoCategories();
  return http.patch<VideoCategory>(VIDEO_CATEGORY_API_PATHS.adminById(id), body);
}

export function deleteVideoCategory(id: string): Promise<ApiResponse<{ id: string; deleted: boolean }>> {
  invalidateActiveVideoCategories();
  return http.delete<{ id: string; deleted: boolean }>(VIDEO_CATEGORY_API_PATHS.adminById(id));
}
