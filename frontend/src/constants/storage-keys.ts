export const STORAGE_KEYS = {
  /** Axios request interceptor (M01-P02-T02) reads this key; 401 interceptor (M01-P02-T04) clears it. */
  AUTH_TOKEN: 'cos_auth_token',
  AUTH_USER: 'cos_auth_user_v1',
  REFRESH_TOKEN: 'cos_refresh_token',
  THEME: 'cos_theme',
  SIDEBAR_COLLAPSED: 'cos_sidebar_collapsed',
  RECENT_CONTESTS: 'cos_recent_contests',
  BRANDS_CONFIG: 'cos_brands_config_v1',
  /** Optional cache of GET /organizations/:slug/branding. API remains the primary source (M04-P03-T04). */
  ORGANIZATION_BRANDING_CACHE: 'cos_org_branding_cache_v1',
  ACTIVE_TENANT_ID: 'cos_active_tenant_id_v1',
  ACTIVE_BRAND: 'cos_active_brand_v1',
  /**
   * Optional client pointer to a contest UUID already known to this browser.
   * Not seeded. There is no public or creator contest-list API (CREATOR and
   * VIEWER are forbidden on GET /contests). Admin contests use the API.
   */
  CONTESTS_CONFIG: 'cos_contests_v1',
  /** Compliance notices have no HTTP API. Local prototype only. */
  TENANT_WARNINGS: 'cos_tenant_warnings_v1',
} as const;
