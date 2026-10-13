import { STORAGE_KEYS } from '../../../constants/storage-keys';
import {
  deploymentBrandPlaceholder,
  deploymentOrganizationSlug,
  hexToHslTriplet,
  getContrastForeground,
} from '../../../lib/theme-utils';
import type { TenantBrandConfig } from '../../../types/tenant';
import type {
  OrganizationBranding,
  OrganizationBrandingView,
} from '../../../services/organizations-api';

/**
 * Map API branding onto the existing theme engine (M04-P03).
 *
 * `cos_brands_config_v1` remains the local catalog of prototype tenants
 * because M04 has no organization-list API. Color, logo, and tagline for a
 * slug that the API returned are taken from that payload. The cache key
 * `cos_org_branding_cache_v1` is optional and is overwritten only after a
 * successful GET or PUT.
 *
 * `backgroundStyle`, subdomain, and customDomain are not Organization.branding
 * fields. Subdomain/customDomain stay on the local catalog. They are not sent
 * to PUT.
 *
 * Historical branding JSON without `primaryColor` (for example an old
 * `themeColor` key) is not remapped. Tokens stay on the local brand until a
 * schema-valid document is stored.
 */

export interface CssVariableTarget {
  style: {
    setProperty: (name: string, value: string) => void;
  };
}

export function isSchemaBranding(value: unknown): value is OrganizationBranding {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return typeof record.primaryColor === 'string' && typeof record.logoUrl === 'string';
}

export function cssVariablesFromApiBranding(
  branding: OrganizationBranding
): Record<string, string> {
  const variables: Record<string, string> = {
    '--primary': hexToHslTriplet(branding.primaryColor),
    '--primary-foreground': getContrastForeground(branding.primaryColor),
    '--ring': hexToHslTriplet(branding.primaryColor),
  };

  if (branding.accentColor) {
    variables['--accent'] = hexToHslTriplet(branding.accentColor);
    variables['--accent-foreground'] = getContrastForeground(branding.accentColor);
  }

  return variables;
}

export function applyCssVariables(
  target: CssVariableTarget,
  variables: Record<string, string>
): void {
  for (const [name, value] of Object.entries(variables)) {
    target.style.setProperty(name, value);
  }
}

export function applyApiBrandingCss(
  branding: OrganizationBranding,
  target?: CssVariableTarget
): Record<string, string> {
  const variables = cssVariablesFromApiBranding(branding);
  const element =
    target ??
    (typeof document !== 'undefined'
      ? (document.documentElement as unknown as CssVariableTarget)
      : null);
  if (element) {
    applyCssVariables(element, variables);
  }
  return variables;
}

export function readActiveTenantSlug(): string {
  return deploymentOrganizationSlug();
}

type BrandingCache = Record<string, OrganizationBrandingView>;

function readCacheMap(): BrandingCache {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORGANIZATION_BRANDING_CACHE);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BrandingCache;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function readBrandingCache(slug: string): OrganizationBrandingView | null {
  const cached = readCacheMap()[slug];
  return cached ?? null;
}

export function writeBrandingCache(view: OrganizationBrandingView): void {
  if (typeof window === 'undefined') return;
  try {
    const next = { ...readCacheMap(), [view.slug]: view };
    localStorage.setItem(STORAGE_KEYS.ORGANIZATION_BRANDING_CACHE, JSON.stringify(next));
  } catch {
    // cache is optional
  }
}

export function fallbackBrandForApi(api: OrganizationBrandingView): TenantBrandConfig {
  return {
    ...deploymentBrandPlaceholder(api.slug),
    organizationId: api.id,
    name: api.name,
    slug: api.slug,
    id: api.slug,
  };
}

/**
 * M10: Organization.status from the API replaces the local prototype status.
 * The public branding view carries only `status`; the super-admin view also
 * carries `suspendedAt` and `suspensionReason`. `suspendedBy` is not an API
 * field, so it is cleared.
 */
function apiSuspensionFields(api: OrganizationBrandingView): Partial<TenantBrandConfig> {
  if (!api.status) return {};
  const suspended = api.status === 'SUSPENDED';
  return {
    status: api.status,
    suspendedAt: suspended ? (api.suspendedAt ?? undefined) : undefined,
    suspensionReason: suspended ? (api.suspensionReason ?? undefined) : undefined,
    suspendedBy: undefined,
  };
}

export function mergeApiOrganizationBranding(
  base: TenantBrandConfig,
  api: OrganizationBrandingView
): TenantBrandConfig {
  const next: TenantBrandConfig = {
    ...base,
    organizationId: api.id,
    name: api.name || base.name,
    slug: api.slug || base.slug,
    ...apiSuspensionFields(api),
  };

  if (!isSchemaBranding(api.branding)) {
    return next;
  }

  const branding = api.branding;
  return {
    ...next,
    logoUrl: branding.logoUrl,
    tagline: branding.tagline ?? base.tagline,
    colors: {
      ...base.colors,
      primary: branding.primaryColor,
      primaryHsl: hexToHslTriplet(branding.primaryColor),
      primaryForeground: getContrastForeground(branding.primaryColor),
      accent: branding.accentColor ?? base.colors.accent,
      accentHsl: branding.accentColor
        ? hexToHslTriplet(branding.accentColor)
        : base.colors.accentHsl,
      accentForeground: branding.accentColor
        ? getContrastForeground(branding.accentColor)
        : base.colors.accentForeground,
    },
  };
}

export function buildOrganizationBrandingPayload(input: {
  primaryColor: string;
  logoUrl: string;
  accentColor?: string;
  tagline?: string;
}): OrganizationBranding {
  const payload: OrganizationBranding = {
    primaryColor: input.primaryColor,
    logoUrl: input.logoUrl,
  };
  if (input.accentColor) payload.accentColor = input.accentColor;
  if (input.tagline !== undefined) payload.tagline = input.tagline;
  return payload;
}
