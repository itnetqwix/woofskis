import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../..', import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('single-organization admin UI', () => {
  it('does not offer a brand or tenant selector on contest management', () => {
    const table = source('src/features/admin/components/contests-management-table.tsx');
    const modal = source('src/features/admin/components/contest-create-modal.tsx');
    const hook = source('src/features/admin/hooks/use-contests-management.ts');

    assert.equal(table.includes('All Brand Tenants'), false);
    assert.equal(table.includes('customDomain'), false);
    assert.equal(modal.includes('Target Brand Tenant'), false);
    assert.equal(hook.includes('userOrganizationId'), false);
    assert.match(hook, /toCreateContestRequest\(newContestData\)/);
  });

  it('does not render a stored domain label in the product chrome', () => {
    const header = source('src/components/layout/app-header.tsx');
    const login = source('src/app/(auth)/login/page.tsx');
    const viewer = source('src/features/judging/components/viewer-container.tsx');
    const overlay = source('src/features/admin/components/tenant-suspension-overlay.tsx');

    assert.equal(header.includes('customDomain'), false);
    assert.equal(header.includes('ripskis.com'), false);
    assert.equal(login.includes('customDomain'), false);
    assert.equal(login.includes('ripskis.com'), false);
    assert.equal(viewer.includes('customDomain'), false);
    assert.equal(overlay.includes('customDomain'), false);
    assert.match(header, /activeBrand\?\.name/);
    assert.match(login, /activeBrand\?\.name/);
  });

  it('does not mount brand identity management', () => {
    const page = source('src/app/(dashboard)/admin/contests/page.tsx');
    const brands = source('src/app/(dashboard)/admin/brands/page.tsx');
    assert.equal(page.includes('BrandThemeForm'), false);
    assert.equal(page.includes('updateOrganizationBranding'), false);
    assert.match(brands, /router\.replace\('\/admin\/contests'\)/);
  });
});
