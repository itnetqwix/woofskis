import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ROLE_GUARD_PAGE_FILES,
  PROTECTED_DASHBOARD_ROUTES,
  type ProtectedDashboardRoute,
} from '../../src/components/auth/role-guard-policy';

const FRONTEND_ROOT = fileURLToPath(new URL('../..', import.meta.url));

const PAGE_ROUTE: Record<(typeof ROLE_GUARD_PAGE_FILES)[number], ProtectedDashboardRoute> = {
  'src/app/(dashboard)/creator/page.tsx': '/creator',
  'src/app/(dashboard)/creator/friends/page.tsx': '/creator/friends',
  'src/app/(dashboard)/creator/friends/[friendshipId]/page.tsx': '/creator/friends',
  'src/app/(dashboard)/admin/moderation/page.tsx': '/admin/moderation',
  'src/app/(dashboard)/admin/contests/page.tsx': '/admin/contests',
  'src/app/(dashboard)/admin/creators/page.tsx': '/admin/creators',
  'src/app/(dashboard)/admin/creators/[id]/page.tsx': '/admin/creators',
  'src/app/(dashboard)/admin/contests/[id]/creators/page.tsx': '/admin/contests',
  'src/app/(dashboard)/admin/leaderboard/page.tsx': '/admin/leaderboard',
  'src/app/(dashboard)/admin/categories/page.tsx': '/admin/categories',
};

describe('RoleGuard page audit', () => {
  it('covers creator, admin contests, and moderation', () => {
    assert.deepEqual(
      [...ROLE_GUARD_PAGE_FILES],
      [
        'src/app/(dashboard)/creator/page.tsx',
        'src/app/(dashboard)/creator/friends/page.tsx',
        'src/app/(dashboard)/creator/friends/[friendshipId]/page.tsx',
        'src/app/(dashboard)/admin/moderation/page.tsx',
        'src/app/(dashboard)/admin/contests/page.tsx',
        'src/app/(dashboard)/admin/creators/page.tsx',
        'src/app/(dashboard)/admin/creators/[id]/page.tsx',
        'src/app/(dashboard)/admin/contests/[id]/creators/page.tsx',
        'src/app/(dashboard)/admin/leaderboard/page.tsx',
        'src/app/(dashboard)/admin/categories/page.tsx',
      ]
    );
    assert.deepEqual(Object.keys(PROTECTED_DASHBOARD_ROUTES).sort(), [
      '/admin/categories',
      '/admin/contests',
      '/admin/creators',
      '/admin/leaderboard',
      '/admin/moderation',
      '/creator',
      '/creator/friends',
    ]);
  });

  it('each audited page wraps with RoleGuard route matching the policy key', () => {
    for (const relativePath of ROLE_GUARD_PAGE_FILES) {
      const source = readFileSync(join(FRONTEND_ROOT, relativePath), 'utf8');
      const route = PAGE_ROUTE[relativePath];
      assert.ok(source.includes("import { RoleGuard } from '@/components/auth/role-guard'"));
      assert.ok(source.includes(`<RoleGuard route="${route}">`));
    }
  });
});
