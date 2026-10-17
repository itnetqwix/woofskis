import { http, type ApiResponse } from './api-client';

export const NOTIFICATION_API_PATHS = {
  list: '/notifications',
  readAll: '/notifications/read-all',
  read: (id: string) => `/notifications/${encodeURIComponent(id)}/read`,
} as const;

export type ApiNotificationType =
  | 'SUBMISSION_PENDING_REVIEW'
  | 'SUBMISSION_APPROVED'
  | 'SUBMISSION_DELETED';

export interface ApiNotification {
  id: string;
  type: ApiNotificationType;
  title: string;
  body: string | null;
  submissionId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface ApiNotificationList {
  items: ApiNotification[];
  unreadCount: number;
}

export function listNotifications(): Promise<ApiResponse<ApiNotificationList>> {
  return http.get<ApiNotificationList>(NOTIFICATION_API_PATHS.list);
}

export function markNotificationRead(id: string): Promise<ApiResponse<null>> {
  return http.post<null>(NOTIFICATION_API_PATHS.read(id));
}

export function markAllNotificationsRead(): Promise<ApiResponse<null>> {
  return http.post<null>(NOTIFICATION_API_PATHS.readAll);
}
