import type { TenantBrandConfig } from '../../../types/tenant';
import type { SuperAdminOrganization } from '../../../services/super-admin-api';
import { fallbackBrandForApi, mergeApiOrganizationBranding } from './organization-branding';

/**
 * Build the super-admin fleet from `GET /super-admin/organizations` (M10-P02-T01).
 *
 * The API list decides which organizations appear and their status. The local
 * brand catalog only supplies visual fields the API does not store
 * (customDomain, background style) for a matching slug.
 */
export function buildSuperAdminFleet(
  organizations: SuperAdminOrganization[],
  catalog: TenantBrandConfig[]
): TenantBrandConfig[] {
  return organizations.map((org) => {
    const base =
      catalog.find((brand) => brand.slug === org.slug || brand.id === org.slug) ??
      fallbackBrandForApi(org);
    return mergeApiOrganizationBranding(base, org);
  });
}
