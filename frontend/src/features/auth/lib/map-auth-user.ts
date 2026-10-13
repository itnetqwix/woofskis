import type { AuthUser, UserRole } from '../../../types/auth';
import type { ApiAuthUser } from '../../../services/auth-api';

/**
 * Map a sanitized backend auth user onto the existing `AuthUser` session shape.
 *
 * `fullName` / API `name` → `displayName`.
 * `avatarUrl` is a presigned profile image when the creator has uploaded one.
 * `handle` / `username` are **not** API fields (M02-P01-T05/T06).
 * `username` is filled with the email local-part as a **client-only display
 * fallback** so the existing `AuthUser.username` required field stays typed.
 * It is never POSTed.
 *
 * Roles are ADMIN and CREATOR.
 * `passwordHash` is stripped if ever present.
 */

const API_TO_SESSION_ROLE: Record<string, UserRole> = {
  CREATOR: 'CREATOR',
  ADMIN: 'ADMIN',
};

export function mapApiRoleToSessionRole(role: string): UserRole {
  if (role in API_TO_SESSION_ROLE) {
    return API_TO_SESSION_ROLE[role] ?? (role as UserRole);
  }
  return role as UserRole;
}

function displayUsernameFromEmail(email: string): string {
  const local = email.split('@')[0]?.trim() ?? '';
  return local || 'user';
}

function omitPasswordHash<T extends object>(value: T): T {
  if ('passwordHash' in value) {
    const { passwordHash: _omitted, ...rest } = value as T & { passwordHash?: unknown };
    void _omitted;
    return rest as T;
  }
  return value;
}

export function mapApiUserToAuthUser(apiUser: ApiAuthUser): AuthUser {
  const safeUser = omitPasswordHash(apiUser);

  return {
    id: safeUser.id,
    email: safeUser.email,
    username: displayUsernameFromEmail(safeUser.email),
    displayName: safeUser.name,
    role: mapApiRoleToSessionRole(String(safeUser.role)),
    createdAt: safeUser.createdAt,
    ...(typeof safeUser.avatarUrl === 'string' && safeUser.avatarUrl.length > 0
      ? { avatarUrl: safeUser.avatarUrl }
      : {}),
  };
}

export function assertNoPasswordHash(value: unknown): void {
  if (value && typeof value === 'object' && 'passwordHash' in value) {
    throw new Error('passwordHash must never reach the frontend session');
  }
}
