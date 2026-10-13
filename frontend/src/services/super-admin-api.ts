import { http, type ApiResponse } from './api-client';
import type { OrganizationBranding, OrganizationStatus } from './organizations-api';

/**
 * Super-admin organization HTTP helpers (M10-P02).
 *
 * SUPER_ADMIN only on the backend. Returns the frozen envelope. Auth is the
 * existing Bearer interceptor; 401 handling stays in `src/lib/axios.ts`.
 */

export const SUPER_ADMIN_API_PATHS = {
  organizations: '/super-admin/organizations',
  suspend: (id: string) => `/super-admin/organizations/${encodeURIComponent(id)}/suspend`,
  reinstate: (id: string) => `/super-admin/organizations/${encodeURIComponent(id)}/reinstate`,
} as const;

export interface SuperAdminOrganization {
  id: string;
  name: string;
  slug: string;
  branding: OrganizationBranding | Record<string, unknown> | null;
  status: OrganizationStatus;
  suspendedAt: string | null;
  suspensionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export function listSuperAdminOrganizations(): Promise<ApiResponse<SuperAdminOrganization[]>> {
  return http.get<SuperAdminOrganization[]>(SUPER_ADMIN_API_PATHS.organizations);
}

/** Reason is required free text (no reason taxonomy). */
export function suspendOrganization(
  id: string,
  reason: string
): Promise<ApiResponse<SuperAdminOrganization>> {
  return http.post<SuperAdminOrganization>(SUPER_ADMIN_API_PATHS.suspend(id), { reason });
}

export function reinstateOrganization(id: string): Promise<ApiResponse<SuperAdminOrganization>> {
  return http.post<SuperAdminOrganization>(SUPER_ADMIN_API_PATHS.reinstate(id), {});
}
