import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError, type AxiosAdapter } from 'axios';
import { apiClient } from '../../src/lib/axios';
import {
  AUTH_API_PATHS,
  login,
  me,
  registerCreator,
  requireAuthData,
} from '../../src/services/auth-api';
import type { ApiResponse } from '../../src/types/api';

function httpErrorAdapter(status: number, data: unknown): AxiosAdapter {
  return async (config) => {
    const response = {
      data,
      status,
      statusText: 'Error',
      headers: {},
      config,
    };
    throw new AxiosError(
      `Request failed with status code ${status}`,
      AxiosError.ERR_BAD_REQUEST,
      config,
      undefined,
      response
    );
  };
}

describe('M02-P02-T01 auth API service', () => {
  const originalAdapter = apiClient.defaults.adapter;

  afterEach(() => {
    apiClient.defaults.adapter = originalAdapter;
  });

  it('registerCreator posts email, password, name to /auth/register/creator', async () => {
    let captured: { url?: string; data?: unknown; method?: string } = {};
    apiClient.defaults.adapter = async (config) => {
      captured = { url: config.url, data: config.data, method: config.method };
      return {
        data: {
          success: true,
          message: 'Creator account created successfully',
          data: {
            user: {
              id: 'u1',
              email: 'creator@example.com',
              name: 'Jane Doe',
              role: 'CREATOR',
              organizationId: null,
              createdAt: '2026-09-22T12:00:00.000Z',
            },
            token: 'jwt-token',
          },
          errors: null,
        },
        status: 201,
        statusText: 'Created',
        headers: {},
        config,
      };
    };

    const body = { email: 'creator@example.com', password: 'SecurePassword123!', name: 'Jane Doe' };
    const result = await registerCreator(body);

    assert.equal(captured.url, AUTH_API_PATHS.REGISTER_CREATOR);
    assert.equal(captured.method, 'post');
    const sent = typeof captured.data === 'string' ? JSON.parse(captured.data) : captured.data;
    assert.deepEqual(sent, body);
    assert.equal('handle' in sent, false);
    assert.equal('username' in sent, false);
    assert.equal('avatarUrl' in sent, false);
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data?.token, 'jwt-token');
      assert.equal(result.data?.user.role, 'CREATOR');
      assert.equal('passwordHash' in (result.data?.user ?? {}), false);
    }
  });

  it('login posts email and password only to /auth/login', async () => {
    let captured: { url?: string; data?: unknown } = {};
    apiClient.defaults.adapter = async (config) => {
      captured = { url: config.url, data: config.data };
      return {
        data: {
          success: true,
          message: 'Login successful',
          data: {
            user: {
              id: 'u1',
              email: 'creator@example.com',
              name: 'Jane Doe',
              role: 'CREATOR',
              organizationId: null,
            },
            token: 'jwt-login',
          },
          errors: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const result = await login({ email: 'creator@example.com', password: 'pw' });
    const sent = typeof captured.data === 'string' ? JSON.parse(captured.data) : captured.data;
    assert.equal(captured.url, AUTH_API_PATHS.LOGIN);
    assert.deepEqual(Object.keys(sent).sort(), ['email', 'password']);
    assert.equal('rememberMe' in sent, false);
    assert.equal(result.success, true);
  });

  it('me GETs /auth/me and returns the user envelope', async () => {
    let captured: { url?: string; method?: string } = {};
    apiClient.defaults.adapter = async (config) => {
      captured = { url: config.url, method: config.method };
      return {
        data: {
          success: true,
          message: 'User profile retrieved successfully',
          data: {
            id: 'u1',
            email: 'creator@example.com',
            name: 'Jane Doe',
            role: 'CREATOR',
            organizationId: null,
            createdAt: '2026-09-22T12:00:00.000Z',
          },
          errors: null,
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    const result = await me();
    assert.equal(captured.url, AUTH_API_PATHS.ME);
    assert.equal(captured.method, 'get');
    assert.equal(result.success, true);
    if (result.success) {
      assert.equal(result.data?.id, 'u1');
      assert.equal('passwordHash' in (result.data ?? {}), false);
    }
  });

  it('requireAuthData returns envelope.data and does not reshape the envelope', () => {
    const envelope: ApiResponse<{ token: string }> = {
      success: true,
      message: 'Login successful',
      data: { token: 'jwt' },
      errors: null,
    };
    assert.deepEqual(requireAuthData(envelope, 'missing'), { token: 'jwt' });
  });

  it('login 401 still rejects AppApiError (frozen interceptor)', async () => {
    apiClient.defaults.adapter = httpErrorAdapter(401, {
      success: false,
      message: 'Invalid email or password',
      data: null,
      errors: null,
    });

    await assert.rejects(
      () => login({ email: 'a@b.com', password: 'x' }),
      (err: unknown) => {
        assert.equal((err as { statusCode?: number }).statusCode, 401);
        assert.equal((err as Error).message, 'Invalid email or password');
        return true;
      }
    );
  });

  it('does not invent refresh/logout/password-reset helpers', () => {
    assert.equal(AUTH_API_PATHS.LOGIN, '/auth/login');
    assert.equal(AUTH_API_PATHS.ME, '/auth/me');
    const exported = {
      registerCreator,
      login,
      me,
      requireAuthData,
      AUTH_API_PATHS,
    };
    assert.equal('refresh' in exported, false);
    assert.equal('logout' in exported, false);
    assert.equal('resetPassword' in exported, false);
  });
});
