import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_TENANT_BRANDS } from '../../src/constants/mock-tenant-data';
import {
  applyCssVariables,
  buildOrganizationBrandingPayload,
  cssVariablesFromApiBranding,
  isSchemaBranding,
  mergeApiOrganizationBranding,
} from '../../src/features/admin/lib/organization-branding';
import { hexToHslTriplet } from '../../src/lib/theme-utils';

describe('M04-P03 organization branding theme tokens', () => {
  const woofskis = DEFAULT_TENANT_BRANDS[0];

  it('builds a PUT body from theme fields and omits slug, name, and backgroundStyle', () => {
    const body = buildOrganizationBrandingPayload({
      primaryColor: '#f97316',
      accentColor: '#fbbf24',
      logoUrl: 'https://woofskis.com/logo.png',
      tagline: 'High-Octane Comedy & Short Entertainment Showdowns',
    });

    assert.deepEqual(body, {
      primaryColor: '#f97316',
      accentColor: '#fbbf24',
      logoUrl: 'https://woofskis.com/logo.png',
      tagline: 'High-Octane Comedy & Short Entertainment Showdowns',
    });
    assert.equal('slug' in body, false);
    assert.equal('name' in body, false);
    assert.equal('backgroundStyle' in body, false);
    assert.equal('status' in body, false);
  });

  it('injects CSS variables from API branding tokens', () => {
    const branding = {
      primaryColor: '#f97316',
      accentColor: '#fbbf24',
      logoUrl: 'https://woofskis.com/logo.png',
    };
    const applied: Record<string, string> = {};
    const variables = cssVariablesFromApiBranding(branding);
    applyCssVariables(
      {
        style: {
          setProperty(name: string, value: string) {
            applied[name] = value;
          },
        },
      },
      variables
    );

    assert.equal(applied['--primary'], hexToHslTriplet('#f97316'));
    assert.equal(applied['--ring'], hexToHslTriplet('#f97316'));
    assert.equal(applied['--accent'], hexToHslTriplet('#fbbf24'));
    assert.equal(typeof applied['--primary-foreground'], 'string');
    assert.equal(typeof applied['--accent-foreground'], 'string');
  });

  it('overlays API branding onto the Woofskis catalog brand without inventing status', () => {
    const api = {
      id: 'e7a18492-91f2-4c22-9fa4-a4f61e890123',
      name: 'Woofskis',
      slug: 'woofskis',
      branding: {
        primaryColor: '#FF5722',
        logoUrl: 'https://woofskis.com/logo.png',
        tagline: 'Seeded tagline',
      },
    };
    const merged = mergeApiOrganizationBranding(woofskis, api);

    assert.equal(merged.organizationId, api.id);
    assert.equal(merged.slug, 'woofskis');
    assert.equal(merged.id, woofskis.id);
    assert.equal(merged.colors.primary, '#FF5722');
    assert.equal(merged.colors.primaryHsl, hexToHslTriplet('#FF5722'));
    assert.equal(merged.logoUrl, 'https://woofskis.com/logo.png');
    assert.equal(merged.tagline, 'Seeded tagline');
    assert.equal(merged.status, woofskis.status);
    assert.equal(
      isSchemaBranding({ themeColor: '#FF5722', logoUrl: 'https://woofskis.com/logo.png' }),
      false
    );
  });
});
