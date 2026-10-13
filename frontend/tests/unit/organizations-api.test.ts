import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AxiosAdapter } from 'axios';
import { apiClient } from '../../src/lib/axios';
import {
  ORGANIZATION_API_PATHS,
  getOrganizationBranding,
  updateOrganizationBranding,
} from '../../src/services/organizations-api';

describe('M04-P03-T01 organizations API client', () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('GET branding uses the public slug path and returns the envelope', async () => {
    let captured: { url?: string; method?: string } = {};
    apiClient.defaults.adapter = (async (config) => {
      captured = { url: config.url, method: config.method };
      return {
        data: {
          success: true,
          message: 'Organization branding retrieved successfully',
          data: {
            id: 'e7a18492-91f2-4c22-9fa4-a4f61e890123',
            name: 'Woofskis',
            slug: 'woofskis',
            branding: {
              primaryColor: '#FF5722',
              logoUrl: 'https://woofskis.com/logo.png',
            },
          },
          errors: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    const result = await getOrganizationBranding('woofskis');
    assert.equal(captured.method, 'get');
    assert.equal(captured.url, ORGANIZATION_API_PATHS.brandingBySlug('woofskis'));
    assert.equal(result.success, true);
    if (result.success && result.data) {
      assert.equal(result.data.slug, 'woofskis');
      assert.equal(result.data.branding && 'primaryColor' in result.data.branding, true);
    }
  });

  it('PUT branding posts schema fields to the organization id path', async () => {
    let captured: { url?: string; method?: string; data?: unknown } = {};
    const body = {
      primaryColor: '#f97316',
      logoUrl: 'https://woofskis.com/logo.png',
      accentColor: '#fbbf24',
      tagline: 'Showdowns',
    };

    apiClient.defaults.adapter = (async (config) => {
      captured = { url: config.url, method: config.method, data: config.data };
      return {
        data: {
          success: true,
          message: 'Organization branding updated successfully',
          data: {
            id: 'org-1',
            name: 'Woofskis',
            slug: 'woofskis',
            branding: body,
          },
          errors: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    }) as AxiosAdapter;

    const id = 'e7a18492-91f2-4c22-9fa4-a4f61e890123';
    const result = await updateOrganizationBranding(id, body);
    assert.equal(captured.method, 'put');
    assert.equal(captured.url, ORGANIZATION_API_PATHS.brandingById(id));
    const sent = typeof captured.data === 'string' ? JSON.parse(captured.data) : captured.data;
    assert.deepEqual(sent, body);
    assert.equal(result.success, true);
  });
});
