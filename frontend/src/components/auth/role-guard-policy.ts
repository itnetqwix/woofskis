import type { UserRole } from '../../types/auth';

/**
 * M03-P02 frontend route-guard policy.
 *
 * Backend roles are ADMIN and CREATOR.
 * ADMIN may open /admin/contests, /admin/creators, and /admin/moderation.
 * CREATOR may open /creator and /creator/friends.
 *
 * Axios HTTP 401 still does not redirect (frozen M01-P02-T04). These
 * targets apply only to client RoleGuard on protected dashboard routes.
 */

export const UNAUTHENTICATED_REDIRECT = '/login';

export const SESSION_ROLE_FROM_API = {
  CREATOR: 'CREATOR',
  ADMIN: 'ADMIN',
} as const satisfies Record<string, UserRole>;

const SESSION_ROLE_EQUIVALENTS: Record<string, UserRole> = {
  CREATOR: 'CREATOR',
  ADMIN: 'ADMIN',
};

export const ROLE_GUARD_PAGE_FILES = [
  'src/app/(dashboard)/creator/page.tsx',
  'src/app/(dashboard)/creator/friends/page.tsx',
  'src/app/(dashboard)/creator/friends/[friendshipId]/page.tsx',
  'src/app/(dashboard)/admin/moderation/page.tsx',
  'src/app/(dashboard)/admin/contests/page.tsx',
  'src/app/(dashboard)/admin/creators/page.tsx',
  'src/app/(dashboard)/admin/creators/[id]/page.tsx',
  'src/app/(dashboard)/admin/contests/[id]/creators/page.tsx',
] as const;

export type ProtectedDashboardRoute =
  '/creator' | '/creator/friends' | '/admin/moderation' | '/admin/contests' | '/admin/creators';

export interface ProtectedRoutePolicy {
  allowedSessionRoles: readonly UserRole[];
  unauthenticatedRedirect: string;
  /** `null` → RoleGuard 403 fallback (no redirect). */
  unauthorizedRedirect: string | null;
  unauthorizedMessage: string;
}

/**
 * ADMIN manages contests and moderation. CREATOR uses /creator.
 */
export const PROTECTED_DASHBOARD_ROUTES: Record<ProtectedDashboardRoute, ProtectedRoutePolicy> = {
  '/creator': {
    allowedSessionRoles: ['CREATOR'],
    unauthenticatedRedirect: '/login?redirect=/creator',
    unauthorizedRedirect: null,
    unauthorizedMessage: 'Creator Studio is accessible only to verified Creators.',
  },
  '/creator/friends': {
    allowedSessionRoles: ['CREATOR'],
    unauthenticatedRedirect: '/login?redirect=/creator/friends',
    unauthorizedRedirect: null,
    unauthorizedMessage: 'Creator friends are accessible only to verified Creators.',
  },
  '/admin/moderation': {
    allowedSessionRoles: ['ADMIN'],
    unauthenticatedRedirect: UNAUTHENTICATED_REDIRECT,
    unauthorizedRedirect: '/',
    unauthorizedMessage: 'Admin authorization is required to access the moderation queue.',
  },
  '/admin/contests': {
    allowedSessionRoles: ['ADMIN'],
    unauthenticatedRedirect: UNAUTHENTICATED_REDIRECT,
    unauthorizedRedirect: '/',
    unauthorizedMessage: 'Admin authorization is required to manage contests.',
  },
  '/admin/creators': {
    allowedSessionRoles: ['ADMIN'],
    unauthenticatedRedirect: UNAUTHENTICATED_REDIRECT,
    unauthorizedRedirect: '/',
    unauthorizedMessage: 'Admin authorization is required to manage creators.',
  },
};

export function canonicalSessionRole(role: string | null | undefined): UserRole | null {
  if (!role) return null;
  return SESSION_ROLE_EQUIVALENTS[role] ?? (role as UserRole);
}

export function isSessionRoleAllowed(
  sessionRole: string | null | undefined,
  allowedSessionRoles: readonly string[]
): boolean {
  const canonical = canonicalSessionRole(sessionRole);
  if (!canonical) return false;
  return allowedSessionRoles.some((allowed) => canonicalSessionRole(allowed) === canonical);
}

export type RoleGuardDecision =
  | { status: 'loading' }
  | { status: 'allow' }
  | { status: 'unauthenticated'; redirectTo: string }
  | { status: 'unauthorized'; redirectTo: string | null };

export function resolveRoleGuardDecision(input: {
  isClientReady: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionRole: string | null | undefined;
  allowedSessionRoles: readonly string[];
  unauthenticatedRedirect: string;
  unauthorizedRedirect: string | null;
}): RoleGuardDecision {
  if (!input.isClientReady || input.isLoading) {
    return { status: 'loading' };
  }

  if (input.allowedSessionRoles.includes('GUEST')) {
    return { status: 'allow' };
  }

  if (!input.isAuthenticated) {
    return {
      status: 'unauthenticated',
      redirectTo: input.unauthenticatedRedirect,
    };
  }

  if (!isSessionRoleAllowed(input.sessionRole, input.allowedSessionRoles)) {
    return {
      status: 'unauthorized',
      redirectTo: input.unauthorizedRedirect,
    };
  }

  return { status: 'allow' };
}

export function getProtectedRoutePolicy(route: ProtectedDashboardRoute): ProtectedRoutePolicy {
  return PROTECTED_DASHBOARD_ROUTES[route];
}
