import { http, type ApiResponse } from './api-client';
import { AppApiError } from '../lib/axios';

/**
 * Frontend auth HTTP helpers (M02-P02-T01).
 *
 * Paths are relative to axios `baseURL` (`NEXT_PUBLIC_API_BASE_URL`,
 * local template `http://localhost:5000/api/v1`). Canonical contracts:
 * `/docs/knowledge/api-map.md` §1.2 (frozen M02-P01).
 *
 * Returns the frozen M01 `ApiResponse` envelope. Does **not** unwrap
 * `envelope.data`. Does **not** send `handle` / `username` / `avatarUrl` /
 * `rememberMe` / `category` / `bio`. Password hashes must never appear
 * in `data` (backend `sanitizeUser`); callers must not persist them.
 *
 * Refresh tokens, cookies, OAuth, password reset, email verification:
 * NOT SPECIFIED — no helpers here.
 */

export const AUTH_API_PATHS = {
  REGISTER_CREATOR: '/auth/register/creator',
  LOGIN: '/auth/login',
  ME: '/auth/me',
  AVATAR_PRESIGN: '/auth/me/avatar/presign',
} as const;

/** Backend Prisma / JWT role enum. */
export type ApiAuthRole = 'ADMIN' | 'CREATOR';

export interface ApiAuthUser {
  id: string;
  email: string;
  name: string;
  role: ApiAuthRole | string;
  createdAt?: string;
  updatedAt?: string;
  /** Presigned profile image. Omitted when the creator has no image. */
  avatarUrl?: string | null;
}

export interface UpdateProfileRequest {
  name?: string;
  avatarObjectKey?: string | null;
}

export interface PresignAvatarResponse {
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
  expiresInSeconds: number;
  method: 'PUT';
}

export interface AuthSessionData {
  user: ApiAuthUser;
  token: string;
}

export interface RegisterCreatorRequest {
  email: string;
  password: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export function registerCreator(
  body: RegisterCreatorRequest
): Promise<ApiResponse<AuthSessionData>> {
  return http.post<AuthSessionData>(AUTH_API_PATHS.REGISTER_CREATOR, body);
}

export function login(body: LoginRequest): Promise<ApiResponse<AuthSessionData>> {
  return http.post<AuthSessionData>(AUTH_API_PATHS.LOGIN, body);
}

export function me(): Promise<ApiResponse<ApiAuthUser>> {
  return http.get<ApiAuthUser>(AUTH_API_PATHS.ME);
}

export function updateMyProfile(body: UpdateProfileRequest): Promise<ApiResponse<ApiAuthUser>> {
  return http.patch<ApiAuthUser>(AUTH_API_PATHS.ME, body);
}

export function presignAvatar(body: {
  contentType: string;
}): Promise<ApiResponse<PresignAvatarResponse>> {
  return http.post<PresignAvatarResponse>(AUTH_API_PATHS.AVATAR_PRESIGN, body);
}

/**
 * Success envelopes carry the payload in `data`. HTTP errors still reject as
 * `AppApiError` (frozen M01-P02-T04). A success=false envelope should not
 * arrive via axios; treat it as a contract failure.
 */
export function requireAuthData<T>(envelope: ApiResponse<T>, fallbackMessage: string): T {
  if (!envelope.success || envelope.data == null) {
    throw new AppApiError(envelope.success === false ? envelope.message : fallbackMessage, 500);
  }
  return envelope.data;
}
