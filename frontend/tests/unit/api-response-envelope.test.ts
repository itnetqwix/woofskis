import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ApiFailureResponse, ApiResponse, ApiSuccessResponse } from '../../src/types/api';
import { http } from '../../src/services/api-client';
import { apiClient } from '../../src/lib/axios';

const ENVELOPE_KEYS = ['data', 'errors', 'message', 'success'] as const;

function sortedKeys(value: object): string[] {
  return Object.keys(value).sort();
}

describe('M01-P02-T03 ApiResponse envelope', () => {
  it('success envelope uses exactly success, message, data, errors', () => {
    const body: ApiSuccessResponse<{ status: string }> = {
      success: true,
      message: 'Contest Operating System API is healthy',
      data: { status: 'healthy' },
      errors: null,
    };

    assert.deepEqual(sortedKeys(body), [...ENVELOPE_KEYS]);
    assert.equal(body.success, true);
    assert.equal(body.errors, null);
    assert.equal(body.data?.status, 'healthy');
  });

  it('error envelope uses the same four fields with success false and data null', () => {
    const body: ApiFailureResponse = {
      success: false,
      message: 'An error occurred',
      data: null,
      errors: [{ field: 'email', message: 'already in use' }],
    };

    assert.deepEqual(sortedKeys(body), [...ENVELOPE_KEYS]);
    assert.equal(body.success, false);
    assert.equal(body.data, null);
    assert.ok(body.errors);
  });

  it('error envelope may still have errors: null (backend default)', () => {
    const body: ApiFailureResponse = {
      success: false,
      message: 'An error occurred',
      data: null,
      errors: null,
    };

    assert.equal(body.success, false);
    assert.equal(body.data, null);
    assert.equal(body.errors, null);
  });

  it('does not include prototype timestamp, nested error, or top-level meta', () => {
    const body: ApiResponse<{ id: string }> = {
      success: true,
      message: 'Operation completed successfully',
      data: { id: '123' },
      errors: null,
    };

    assert.equal('timestamp' in body, false);
    assert.equal('error' in body, false);
    assert.equal('meta' in body, false);
  });

  it('http.get resolves to the interceptor-unwrapped envelope (does not unwrap data again)', async () => {
    const originalAdapter = apiClient.defaults.adapter;
    const envelope: ApiSuccessResponse<{ status: string }> = {
      success: true,
      message: 'Contest Operating System API is healthy',
      data: { status: 'healthy' },
      errors: null,
    };

    apiClient.defaults.adapter = async (config) => ({
      data: envelope,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    });

    try {
      const result = await http.get<{ status: string }>('/health');
      assert.deepEqual(result, envelope);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.errors, null);
        assert.equal(result.data?.status, 'healthy');
      }
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });
});
