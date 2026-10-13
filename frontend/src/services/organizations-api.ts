import { http, type ApiResponse } from './api-client';

/**
 * Organization branding HTTP helpers (M04-P03-T01).
 *
 * Paths are relative to axios `baseURL` (`NEXT_PUBLIC_API_BASE_URL`).
 * Returns the frozen envelope. Does not unwrap `data`.
 *
 * GET is public. PUT requires the existing Bearer interceptor
 * (`cos_auth_token`). 401 handling stays in `src/lib/axios.ts`.
 *
 * No list, create, delete, suspend, or slug-update helpers here. The M10
 * super-admin list and suspend/reinstate live in `super-admin-api.ts`.
 */

export const ORGANIZATION_API_PATHS = {
  brandingBySlug: (slug: string) => `/organizations/${encodeURIComponent(slug)}/branding`,
  brandingById: (id: string) => `/organizations/${encodeURIComponent(id)}/branding`,
} as const;

/** Documented Organization.branding JSON. primaryColor and logoUrl are required on write. */
export interface OrganizationBranding {
  primaryColor: string;
  logoUrl: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  bannerUrl?: string;
  tagline?: string;
}

export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED';

export interface OrganizationBrandingView {
  id: string;
  name: string;
  slug: string;
  branding: OrganizationBranding | Record<string, unknown> | null;
  /** M10. Suspension reason and timestamp are only on the super-admin view. */
  status?: OrganizationStatus;
  suspendedAt?: string | null;
  suspensionReason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateOrganizationBrandingRequest {
  primaryColor: string;
  logoUrl: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  bannerUrl?: string;
  tagline?: string;
}

const inflightGets = new Map<string, Promise<ApiResponse<OrganizationBrandingView>>>();

export function getOrganizationBranding(
  slug: string
): Promise<ApiResponse<OrganizationBrandingView>> {
  const existing = inflightGets.get(slug);
  if (existing) return existing;

  const request = http
    .get<OrganizationBrandingView>(ORGANIZATION_API_PATHS.brandingBySlug(slug))
    .finally(() => {
      inflightGets.delete(slug);
    });

  inflightGets.set(slug, request);
  return request;
}

export function updateOrganizationBranding(
  organizationId: string,
  body: UpdateOrganizationBrandingRequest
): Promise<ApiResponse<OrganizationBrandingView>> {
  return http.put<OrganizationBrandingView>(
    ORGANIZATION_API_PATHS.brandingById(organizationId),
    body
  );
}
