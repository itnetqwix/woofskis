import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'path';
import { fileURLToPath } from 'node:url';
import {
  PROTECTED_DASHBOARD_ROUTES,
  SESSION_ROLE_FROM_API,
  UNAUTHENTICATED_REDIRECT,
  resolveRoleGuardDecision,
  type ProtectedDashboardRoute,
} from '../../src/components/auth/role-guard-policy';
import { mapApiRoleToSessionRole } from '../../src/features/auth/lib/map-auth-user';

/**
 * M03-P03-T01: independent expected matrix (frozen M03-P02 contracts).
 *
 * Not derived from PROTECTED_DASHBOARD_ROUTES — the test asserts the
 * implementation matches this table.
 *
 * Frontend aliases remain:
 *   BRAND_ADMIN → ORGANIZATION_ADMIN
 *   SUPER_ADMIN → PLATFORM_ADMIN
 *
 * /creator does not grant SUPER_ADMIN (Ch 11.6; extra grant NOT SPECIFIED).
 * Axios 401 interceptor still does not redirect (M01 freeze).
 */

const FRONTEND_ROOT = fileURLToPath(new URL('../..', import.meta.url));

type SessionActor = 'UNAUTH' | 'CREATOR' | 'ADMIN';

type ExpectedDecision =
  | { status: 'allow' }
  | { status: 'unauthenticated'; redirectTo: string }
  | { status: 'unauthorized'; redirectTo: string | null };

const ROUTES: ProtectedDashboardRoute[] = [
  '/creator',
  '/creator/friends',
  '/admin/moderation',
  '/admin/contests',
  '/admin/creators',
  '/admin/leaderboard',
  '/admin/categories',
];

const ROUTE_MATRIX: Record<ProtectedDashboardRoute, Record<SessionActor, ExpectedDecision>> = {
  '/creator': {
    UNAUTH: { status: 'unauthenticated', redirectTo: '/login?redirect=/creator' },
    CREATOR: { status: 'allow' },
    ADMIN: { status: 'unauthorized', redirectTo: null },
  },
  '/creator/friends': {
    UNAUTH: { status: 'unauthenticated', redirectTo: '/login?redirect=/creator/friends' },
    CREATOR: { status: 'allow' },
    ADMIN: { status: 'unauthorized', redirectTo: null },
  },
  '/admin/moderation': {
    UNAUTH: { status: 'unauthenticated', redirectTo: '/login' },
    CREATOR: { status: 'unauthorized', redirectTo: '/' },
    ADMIN: { status: 'allow' },
  },
  '/admin/contests': {
    UNAUTH: { status: 'unauthenticated', redirectTo: '/login' },
    CREATOR: { status: 'unauthorized', redirectTo: '/' },
    ADMIN: { status: 'allow' },
  },
  '/admin/creators': {
    UNAUTH: { status: 'unauthenticated', redirectTo: '/login' },
    CREATOR: { status: 'unauthorized', redirectTo: '/' },
    ADMIN: { status: 'allow' },
  },
  '/admin/leaderboard': {
    UNAUTH: { status: 'unauthenticated', redirectTo: '/login' },
    CREATOR: { status: 'unauthorized', redirectTo: '/' },
    ADMIN: { status: 'allow' },
  },
  '/admin/categories': {
    UNAUTH: { status: 'unauthenticated', redirectTo: '/login' },
    CREATOR: { status: 'unauthorized', redirectTo: '/' },
    ADMIN: { status: 'allow' },
  },
};

function decide(route: ProtectedDashboardRoute, actor: SessionActor) {
  const policy = PROTECTED_DASHBOARD_ROUTES[route];
  const isAuthenticated = actor !== 'UNAUTH';
  return resolveRoleGuardDecision({
    isClientReady: true,
    isLoading: false,
    isAuthenticated,
    sessionRole: isAuthenticated ? actor : null,
    allowedSessionRoles: policy.allowedSessionRoles,
    unauthenticatedRedirect: policy.unauthenticatedRedirect,
    unauthorizedRedirect: policy.unauthorizedRedirect,
  });
}

describe('M03-P03-T01 frontend role × route allow/deny matrix', () => {
  it('keeps frozen M02 session aliases', () => {
    assert.equal(SESSION_ROLE_FROM_API.ADMIN, 'ADMIN');
    assert.equal(SESSION_ROLE_FROM_API.CREATOR, 'CREATOR');
    assert.equal(mapApiRoleToSessionRole('ADMIN'), 'ADMIN');
    assert.equal(UNAUTHENTICATED_REDIRECT, '/login');
  });

  for (const route of ROUTES) {
    for (const actor of Object.keys(ROUTE_MATRIX[route]) as SessionActor[]) {
      const expected = ROUTE_MATRIX[route][actor];
      it(`${route} × ${actor} → ${expected.status}${
        'redirectTo' in expected ? ` (${expected.redirectTo})` : ''
      }`, () => {
        assert.deepEqual(decide(route, actor), expected);
      });
    }
  }

  it('does not grant ADMIN access to /creator', () => {
    assert.deepEqual([...PROTECTED_DASHBOARD_ROUTES['/creator'].allowedSessionRoles], ['CREATOR']);
    assert.equal(decide('/creator', 'ADMIN').status, 'unauthorized');
  });

  it('does not invent undocumented session roles in allow lists', () => {
    const allAllowed = Object.values(PROTECTED_DASHBOARD_ROUTES).flatMap(
      (policy) => policy.allowedSessionRoles
    );
    for (const role of allAllowed) {
      assert.ok(
        role === 'CREATOR' || role === 'ADMIN',
        `unexpected session role in allow list: ${role}`
      );
    }
  });

  it('axios 401 interceptor still does not redirect (M01 freeze)', () => {
    const axiosSrc = readFileSync(join(FRONTEND_ROOT, 'src/lib/axios.ts'), 'utf8');
    assert.match(axiosSrc, /clearAuthTokenAndEmitUnauthorized/);
    assert.match(axiosSrc, /Does not redirect/);
    assert.doesNotMatch(axiosSrc, /router\.(push|replace)/);
    assert.doesNotMatch(axiosSrc, /window\.location/);
    assert.doesNotMatch(axiosSrc, /location\.href/);
    assert.doesNotMatch(axiosSrc, /['"]\/login['"]/);
  });

  it('RoleGuard still redirects only from resolveRoleGuardDecision.redirectTo', () => {
    const guardSrc = readFileSync(
      join(FRONTEND_ROOT, 'src/components/auth/role-guard.tsx'),
      'utf8'
    );
    assert.match(guardSrc, /router\.replace\(redirectTo\)/);
    assert.match(guardSrc, /useAuthSession/);
    assert.match(guardSrc, /state\.auth/);
  });
});
