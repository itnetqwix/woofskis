import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios';
import { AppApiError, apiClient } from '../../src/lib/axios';
import {
  SUPER_ADMIN_API_PATHS,
  listSuperAdminOrganizations,
  reinstateOrganization,
  suspendOrganization,
  type SuperAdminOrganization,
} from '../../src/services/super-admin-api';
import { buildSuperAdminFleet } from '../../src/features/admin/lib/super-admin-fleet';
import { mergeApiOrganizationBranding } from '../../src/features/admin/lib/organization-branding';
import { DEFAULT_TENANT_BRANDS } from '../../src/constants/mock-tenant-data';

const ROOT = path.resolve(__dirname, '../..');
const ORG_ID = 'e7a18492-91f2-4c22-9fa4-a4f61e890123';

function org(overrides: Partial<SuperAdminOrganization> = {}): SuperAdminOrganization {
  return {
    id: ORG_ID,
    name: 'Woofskis',
    slug: 'woofskis',
    branding: { primaryColor: '#FF5722', logoUrl: 'https://woofskis.com/logo.png' },
    status: 'ACTIVE',
    suspendedAt: null,
    suspensionReason: null,
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
    ...overrides,
  };
}

function respond(config: InternalAxiosRequestConfig, status: number, body: unknown) {
  return { data: body, status, statusText: String(status), headers: {}, config };
}

describe('M10-P02 super-admin API client', () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('T01 lists organizations from GET /super-admin/organizations', async () => {
    let captured: { url?: string; method?: string } = {};
    apiClient.defaults.adapter = (async (config) => {
      captured = { url: config.url, method: config.method };
      return respond(config, 200, {
        success: true,
        message: 'Organizations retrieved successfully',
        data: [
          org(),
          org({ id: 'b2c3d4e5-f6a7-4890-bcde-f12345678901', slug: 'nike', name: 'Nike' }),
        ],
        errors: null,
      });
    }) as AxiosAdapter;

    const result = await listSuperAdminOrganizations();
    assert.equal(captured.method, 'get');
    assert.equal(captured.url, SUPER_ADMIN_API_PATHS.organizations);
    assert.equal(result.success, true);
    assert.equal(result.success && result.data?.length, 2);
  });

  it('T02 suspend POSTs { reason } to the organization id path', async () => {
    let captured: { url?: string; method?: string; data?: unknown } = {};
    apiClient.defaults.adapter = (async (config) => {
      captured = { url: config.url, method: config.method, data: config.data };
      return respond(config, 200, {
        success: true,
        message: 'Organization suspended successfully',
        data: org({
          status: 'SUSPENDED',
          suspendedAt: '2026-09-25T10:00:00.000Z',
          suspensionReason: 'Policy review',
        }),
        errors: null,
      });
    }) as AxiosAdapter;

    const result = await suspendOrganization(ORG_ID, 'Policy review');
    assert.equal(captured.method, 'post');
    assert.equal(captured.url, SUPER_ADMIN_API_PATHS.suspend(ORG_ID));
    const sent = typeof captured.data === 'string' ? JSON.parse(captured.data) : captured.data;
    assert.deepEqual(sent, { reason: 'Policy review' });
    assert.equal(result.success && result.data?.status, 'SUSPENDED');
  });

  it('T02 reinstate POSTs {} to the reinstate path', async () => {
    let captured: { url?: string; method?: string; data?: unknown } = {};
    apiClient.defaults.adapter = (async (config) => {
      captured = { url: config.url, method: config.method, data: config.data };
      return respond(config, 200, {
        success: true,
        message: 'Organization reinstated successfully',
        data: org(),
        errors: null,
      });
    }) as AxiosAdapter;

    const result = await reinstateOrganization(ORG_ID);
    assert.equal(captured.method, 'post');
    assert.equal(captured.url, SUPER_ADMIN_API_PATHS.reinstate(ORG_ID));
    const sent = typeof captured.data === 'string' ? JSON.parse(captured.data) : captured.data;
    assert.deepEqual(sent, {});
    assert.equal(result.success && result.data?.status, 'ACTIVE');
  });

  it('API errors reject with the backend envelope message (403 and 409)', async () => {
    for (const [status, message] of [
      [403, "Forbidden: User role 'BRAND_ADMIN' does not have permission to access this resource"],
      [409, 'Organization is already suspended'],
    ] as const) {
      apiClient.defaults.adapter = (async (config) => {
        const error = Object.assign(new Error(message), {
          isAxiosError: true,
          config,
          response: respond(config, status, { success: false, message, data: null, errors: null }),
        });
        throw error;
      }) as AxiosAdapter;

      await assert.rejects(
        () => suspendOrganization(ORG_ID, 'x'),
        (err: unknown) =>
          err instanceof AppApiError && err.statusCode === status && err.message === message
      );
    }
  });
});

describe('M10-P02 fleet mapping and API status precedence', () => {
  it('T01 fleet lists only API organizations and keeps catalog visuals for matching slugs', () => {
    const catalogWoofskis = DEFAULT_TENANT_BRANDS.find((b) => b.slug === 'woofskis')!;
    const fleet = buildSuperAdminFleet(
      [org(), org({ id: 'c0ffee00-0000-4000-8000-000000000001', slug: 'acme', name: 'Acme' })],
      DEFAULT_TENANT_BRANDS
    );
    assert.equal(fleet.length, 2);
    assert.equal(fleet[0].organizationId, ORG_ID);
    assert.equal(fleet[0].customDomain, catalogWoofskis.customDomain);
    assert.equal(fleet[1].slug, 'acme');
    assert.equal(fleet[1].organizationId, 'c0ffee00-0000-4000-8000-000000000001');
    assert.equal(fleet[1].name, 'Acme');
  });

  it('T02 suspended API organization maps status, reason, and timestamp', () => {
    const [brand] = buildSuperAdminFleet(
      [
        org({
          status: 'SUSPENDED',
          suspendedAt: '2026-09-25T10:00:00.000Z',
          suspensionReason: 'Policy review',
        }),
      ],
      DEFAULT_TENANT_BRANDS
    );
    assert.equal(brand.status, 'SUSPENDED');
    assert.equal(brand.suspensionReason, 'Policy review');
    assert.equal(brand.suspendedAt, '2026-09-25T10:00:00.000Z');
  });

  it('T03/T04 API status overrides a stale local SUSPENDED prototype status', () => {
    const stale = {
      ...DEFAULT_TENANT_BRANDS[0],
      status: 'SUSPENDED' as const,
      suspensionReason: 'Local prototype reason',
      suspendedAt: '2020-01-01T00:00:00.000Z',
      suspendedBy: 'Super Admin',
    };
    const merged = mergeApiOrganizationBranding(stale, {
      id: ORG_ID,
      name: 'Woofskis',
      slug: 'woofskis',
      branding: null,
      status: 'ACTIVE',
    });
    assert.equal(merged.status, 'ACTIVE');
    assert.equal(merged.suspensionReason, undefined);
    assert.equal(merged.suspendedAt, undefined);
    assert.equal(merged.suspendedBy, undefined);
  });

  it('T03 public branding view (status only) drives the overlay flag', () => {
    const merged = mergeApiOrganizationBranding(DEFAULT_TENANT_BRANDS[0], {
      id: ORG_ID,
      name: 'Woofskis',
      slug: 'woofskis',
      branding: null,
      status: 'SUSPENDED',
    });
    assert.equal(merged.status, 'SUSPENDED');
    assert.equal(merged.suspensionReason, undefined);
  });

  it('a view without status (older cache) keeps the existing brand status', () => {
    const merged = mergeApiOrganizationBranding(
      { ...DEFAULT_TENANT_BRANDS[0], status: 'ACTIVE' },
      { id: ORG_ID, name: 'Woofskis', slug: 'woofskis', branding: null }
    );
    assert.equal(merged.status, 'ACTIVE');
  });
});

describe('M10-P02 source wiring', () => {
  const page = readFileSync(path.join(ROOT, 'src/app/(dashboard)/super-admin/page.tsx'), 'utf8');
  const compliance = readFileSync(
    path.join(ROOT, 'src/features/admin/hooks/use-tenant-compliance.ts'),
    'utf8'
  );

  it('super-admin page does not call the organization API', () => {
    assert.doesNotMatch(page, /useSuperAdminOrganizations/);
    assert.doesNotMatch(page, /SuspendOrganizationDialog/);
    assert.match(page, /router\.replace\('\/login'\)/);
  });

  it('T04 local suspension writers are gone from the compliance hook and page', () => {
    for (const name of ['suspendBrand', 'reactivateBrand', 'toggleBrandSuspension']) {
      assert.doesNotMatch(compliance, new RegExp(name));
      assert.doesNotMatch(page, new RegExp(name));
    }
    assert.doesNotMatch(compliance, /status: 'SUSPENDED'/);
  });

  it('contest management does not use a suspension overlay', () => {
    const src = readFileSync(
      path.join(ROOT, 'src/app/(dashboard)/admin/contests/page.tsx'),
      'utf8'
    );
    assert.doesNotMatch(src, /TenantSuspensionOverlay/);
  });
});
