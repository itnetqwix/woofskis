import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  PROTECTED_DASHBOARD_ROUTES,
  SESSION_ROLE_FROM_API,
  UNAUTHENTICATED_REDIRECT,
  isSessionRoleAllowed,
  resolveRoleGuardDecision,
} from '../../src/components/auth/role-guard-policy';
import { mapApiRoleToSessionRole } from '../../src/features/auth/lib/map-auth-user';

describe('RoleGuard policy', () => {
  it('maps ADMIN and CREATOR session roles', () => {
    assert.equal(SESSION_ROLE_FROM_API.ADMIN, 'ADMIN');
    assert.equal(SESSION_ROLE_FROM_API.CREATOR, 'CREATOR');
    assert.equal(mapApiRoleToSessionRole('ADMIN'), 'ADMIN');
    assert.equal(mapApiRoleToSessionRole('CREATOR'), 'CREATOR');
  });

  it('protects /creator for CREATOR only', () => {
    const policy = PROTECTED_DASHBOARD_ROUTES['/creator'];
    assert.deepEqual([...policy.allowedSessionRoles], ['CREATOR']);
    assert.equal(policy.unauthenticatedRedirect, '/login?redirect=/creator');
    assert.equal(isSessionRoleAllowed('CREATOR', policy.allowedSessionRoles), true);
    assert.equal(isSessionRoleAllowed('ADMIN', policy.allowedSessionRoles), false);
  });

  it('protects admin contest and moderation routes for ADMIN', () => {
    for (const route of [
      '/admin/moderation',
      '/admin/contests',
      '/admin/creators',
      '/admin/leaderboard',
      '/admin/categories',
    ] as const) {
      const policy = PROTECTED_DASHBOARD_ROUTES[route];
      assert.deepEqual([...policy.allowedSessionRoles], ['ADMIN']);
      assert.equal(policy.unauthenticatedRedirect, UNAUTHENTICATED_REDIRECT);
      assert.equal(policy.unauthorizedRedirect, '/');
      assert.equal(isSessionRoleAllowed('ADMIN', policy.allowedSessionRoles), true);
      assert.equal(isSessionRoleAllowed('CREATOR', policy.allowedSessionRoles), false);
    }
  });

  it('distinguishes unauthenticated vs unauthorized redirects', () => {
    const creator = PROTECTED_DASHBOARD_ROUTES['/creator'];
    const unauthenticated = resolveRoleGuardDecision({
      isClientReady: true,
      isLoading: false,
      isAuthenticated: false,
      sessionRole: 'GUEST',
      allowedSessionRoles: creator.allowedSessionRoles,
      unauthenticatedRedirect: creator.unauthenticatedRedirect,
      unauthorizedRedirect: creator.unauthorizedRedirect,
    });
    assert.deepEqual(unauthenticated, {
      status: 'unauthenticated',
      redirectTo: '/login?redirect=/creator',
    });

    const admin = PROTECTED_DASHBOARD_ROUTES['/admin/contests'];
    const unauthorizedAdmin = resolveRoleGuardDecision({
      isClientReady: true,
      isLoading: false,
      isAuthenticated: true,
      sessionRole: 'CREATOR',
      allowedSessionRoles: admin.allowedSessionRoles,
      unauthenticatedRedirect: admin.unauthenticatedRedirect,
      unauthorizedRedirect: admin.unauthorizedRedirect,
    });
    assert.deepEqual(unauthorizedAdmin, {
      status: 'unauthorized',
      redirectTo: '/',
    });
  });
});
