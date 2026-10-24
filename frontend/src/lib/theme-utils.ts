import { TenantBrandConfig, ContestConfigItem, BackgroundStylePreset } from '../types/tenant';
import { STORAGE_KEYS } from '../constants/storage-keys';

/**
 * Converts a Hex color code (#rrggbb or #rgb) to an HSL object
 */
export function hexToHsl(hexInput: string): { h: number; s: number; l: number } {
  let hex = hexInput.replace(/^#/, '');

  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((c) => c + c)
      .join('');
  }

  if (hex.length !== 6) {
    return { h: 221, s: 83, l: 53 }; // default blue fallback
  }

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return {
    h: Math.round(h * 360 * 10) / 10,
    s: Math.round(s * 100 * 10) / 10,
    l: Math.round(l * 100 * 10) / 10,
  };
}

/**
 * Converts an HSL object to a Hex color string
 */
export function hslToHex(h: number, s: number, l: number): string {
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  let r: number, g: number, b: number;

  if (sNorm === 0) {
    r = g = b = lNorm; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      let tNorm = t;
      if (tNorm < 0) tNorm += 1;
      if (tNorm > 1) tNorm -= 1;
      if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
      if (tNorm < 1 / 2) return q;
      if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
      return p;
    };

    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;

    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Formats a Hex color into a Tailwind-compatible HSL Triplet string: "24.6 95% 53.1%"
 */
export function hexToHslTriplet(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  return `${h} ${s}% ${l}%`;
}

/**
 * Parses an HSL triplet string like "24.6 95% 53.1%" or "221.2 83.2% 53.3%" back to Hex
 */
export function hslTripletToHex(triplet: string): string {
  if (!triplet) return '#3b82f6';
  const parts = triplet.trim().split(/\s+/);
  if (parts.length < 3) return '#3b82f6';

  const h = parseFloat(parts[0]) || 0;
  const s = parseFloat(parts[1].replace('%', '')) || 0;
  const l = parseFloat(parts[2].replace('%', '')) || 0;

  return hslToHex(h, s, l);
}

/**
 * Calculates perceived luminance to determine readable text foreground (black vs white)
 */
export function getContrastForeground(hex: string): string {
  const { l } = hexToHsl(hex);
  // If lightness is high (> 60%), use dark foreground, else white foreground
  return l > 62 ? '222.2 84% 4.9%' : '0 0% 100%';
}

/**
 * Calculates WCAG 2.1 contrast ratio between two hex colors
 */
export function calculateContrastRatio(hex1: string, hex2: string): number {
  const getLum = (hexStr: string) => {
    const clean = hexStr.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;

    const [rr, gg, bb] = [r, g, b].map((c) =>
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * rr + 0.7152 * gg + 0.0722 * bb;
  };

  const lum1 = getLum(hex1);
  const lum2 = getLum(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return Math.round(((brightest + 0.05) / (darkest + 0.05)) * 10) / 10;
}

/**
 * Returns background & card CSS variables for background presets
 */
export function getBackgroundPresetVars(preset: BackgroundStylePreset): {
  background: string;
  card: string;
  foreground: string;
  cardForeground: string;
  border: string;
  muted: string;
} {
  switch (preset) {
    case 'cyber-black':
      return {
        background: '0 0% 3%',
        card: '0 0% 5.5%',
        foreground: '0 0% 96%',
        cardForeground: '0 0% 96%',
        border: '0 0% 12%',
        muted: '0 0% 10%',
      };
    case 'oceanic':
      return {
        background: '215 45% 5.5%',
        card: '215 45% 8.5%',
        foreground: '210 30% 93%',
        cardForeground: '210 30% 93%',
        border: '215 35% 15%',
        muted: '215 35% 12%',
      };
    case 'deep-slate':
      return {
        background: '220 30% 6.5%',
        card: '220 30% 9.5%',
        foreground: '215 20% 92%',
        cardForeground: '215 20% 92%',
        border: '220 20% 16%',
        muted: '220 20% 13%',
      };
    case 'clean-light':
      return {
        background: '0 0% 100%',
        card: '0 0% 100%',
        foreground: '222.2 84% 4.9%',
        cardForeground: '222.2 84% 4.9%',
        border: '214.3 31.8% 91.4%',
        muted: '210 40% 96.1%',
      };
    case 'midnight':
    default:
      return {
        background: '224 71% 4%',
        card: '224 71% 6%',
        foreground: '213 31% 91%',
        cardForeground: '213 31% 91%',
        border: '215 27.9% 16.9%',
        muted: '215 27.9% 16.9%',
      };
  }
}

/**
 * Injects dynamic CSS variables directly into document.documentElement for instant runtime re-theming
 */
export function applyTenantTheme(brand: TenantBrandConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Primary Color
  const primaryHsl = brand.colors.primaryHsl || hexToHslTriplet(brand.colors.primary);
  const primaryFg = brand.colors.primaryForeground || getContrastForeground(brand.colors.primary);
  root.style.setProperty('--primary', primaryHsl);
  root.style.setProperty('--primary-foreground', primaryFg);
  root.style.setProperty('--ring', primaryHsl);

  // Accent Color
  const accentHsl = brand.colors.accentHsl || hexToHslTriplet(brand.colors.accent);
  const accentFg = brand.colors.accentForeground || getContrastForeground(brand.colors.accent);
  root.style.setProperty('--accent', accentHsl);
  root.style.setProperty('--accent-foreground', accentFg);

  // Clean up any stale inline background overrides so themes.css :root and .dark work cleanly
  root.style.removeProperty('--background');
  root.style.removeProperty('--card');
  root.style.removeProperty('--card-foreground');
  root.style.removeProperty('--border');

  // Set tenant identifier attribute
  root.setAttribute('data-tenant', brand.id);
  root.setAttribute('data-brand-domain', brand.customDomain || `${brand.slug}.com`);
}

/**
 * Deployment organization slug. Not a UUID. The Woofskis deployment is `woofskis`.
 */
export function deploymentOrganizationSlug(): string {
  const raw = process.env.NEXT_PUBLIC_DEPLOYMENT_ORGANIZATION_SLUG?.trim();
  if (raw && /^[a-z0-9-]+$/.test(raw)) return raw;
  return 'woofskis';
}

/** Paint placeholder until GET /organizations/:slug/branding returns. */
export function deploymentBrandPlaceholder(slug = deploymentOrganizationSlug()): TenantBrandConfig {
  const isRipskis = slug.toLowerCase() === 'ripskis';
  const primary = isRipskis ? '#8bc144' : '#fa4616';
  const accent = isRipskis ? '#13491e' : '#3e2717';
  return {
    id: slug,
    name: isRipskis ? 'Ripskis' : slug === 'woofskis' ? 'Woofskis' : slug,
    slug,
    subdomain: '',
    customDomain: isRipskis ? 'ripskis.com' : 'woofskis.com',
    logoUrl: isRipskis ? '/logo/ripskis_logo.png' : '/logo/woofskis_logo_with_dog_transparent.png',
    tagline: isRipskis ? 'High-Octane Entertainment Showdowns' : '',
    description: '',
    colors: {
      primary,
      primaryHsl: hexToHslTriplet(primary),
      primaryForeground: '0 0% 100%',
      accent,
      accentHsl: hexToHslTriplet(accent),
      accentForeground: isRipskis ? '132.2 58.7% 12%' : '0 0% 100%',
      backgroundStyle: 'clean-light',
    },
    isDefault: true,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  };
}

/**
 * Previously stored brand documents. Does not write a mock catalog.
 */
export function getStoredBrands(): TenantBrandConfig[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BRANDS_CONFIG);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // ignore unreadable storage
  }

  return [];
}

export function saveStoredBrands(brands: TenantBrandConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.BRANDS_CONFIG, JSON.stringify(brands));
    window.dispatchEvent(new CustomEvent('cos_brands_updated', { detail: brands }));
  } catch (err) {
    console.error('Error saving brands to localStorage:', err);
  }
}

export function getStoredActiveTenant(): TenantBrandConfig {
  if (typeof window !== 'undefined') {
    try {
      const activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TENANT_ID);
      if (activeId) {
        const brands = getStoredBrands();
        const match = brands.find((brand) => brand.slug === activeId || brand.id === activeId);
        return match ?? deploymentBrandPlaceholder(activeId);
      }
    } catch {
      // ignore unreadable storage
    }
  }
  const slug = deploymentOrganizationSlug();
  const brands = getStoredBrands();
  const match = brands.find((brand) => brand.slug === slug || brand.id === slug);
  return match ?? deploymentBrandPlaceholder(slug);
}

export function setActiveTenant(brandOrId: TenantBrandConfig | string): TenantBrandConfig {
  const brands = getStoredBrands();
  const brand =
    typeof brandOrId === 'string'
      ? brands.find(
          (b) => b.id === brandOrId || b.slug === brandOrId || b.customDomain === brandOrId
        ) || deploymentBrandPlaceholder(brandOrId)
      : brandOrId;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TENANT_ID, brand.id);
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BRAND, JSON.stringify(brand));
      applyTenantTheme(brand);
      window.dispatchEvent(new CustomEvent('cos_brand_switched', { detail: brand }));
    } catch (err) {
      console.error('Error setting active tenant:', err);
    }
  }

  return brand;
}

/**
 * Optional contest pointer (`cos_contests_v1`).
 *
 * Does not seed a mock catalog. Admin contest management uses GET /contests.
 * Creator and public contest discovery are NOT SPECIFIED, so this key is only
 * a browser-local UUID pointer when one was stored. An empty store returns [].
 */
export function getStoredContests(): ContestConfigItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTESTS_CONFIG);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Ignore malformed client state.
  }

  return [];
}

export function saveStoredContests(contests: ContestConfigItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.CONTESTS_CONFIG, JSON.stringify(contests));
  } catch (err) {
    console.error('Error saving contests to localStorage:', err);
  }
}
