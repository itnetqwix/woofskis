import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { AxiosError, type AxiosAdapter } from 'axios';
import {
  apiClient,
  AppApiError,
  COS_UNAUTHORIZED_EVENT,
  clearAuthTokenAndEmitUnauthorized,
} from '../../src/lib/axios';
import { STORAGE_KEYS } from '../../src/constants/storage-keys';
import { http } from '../../src/services/api-client';

function httpErrorAdapter(status: number, data: unknown, statusText: string): AxiosAdapter {
  return async (config) => {
    const response = {
      data,
      status,
      statusText,
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

type MemoryStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
};

function createMemoryStorage(): MemoryStorage & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe('M01-P02-T04 axios 401 interceptor', () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;
  let memory: ReturnType<typeof createMemoryStorage>;
  let dispatched: Event[];

  function mockBrowserStorage() {
    memory = createMemoryStorage();
    dispatched = [];
    const fakeWindow = {
      dispatchEvent(event: Event) {
        dispatched.push(event);
        return true;
      },
    };
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: fakeWindow,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      writable: true,
      value: memory,
    });
  }

  afterEach(() => {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: originalWindow,
    });
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      writable: true,
      value: originalLocalStorage,
    });
  });

  it('uses STORAGE_KEYS.AUTH_TOKEN value cos_auth_token and event name cos:unauthorized', () => {
    assert.equal(STORAGE_KEYS.AUTH_TOKEN, 'cos_auth_token');
    assert.equal(COS_UNAUTHORIZED_EVENT, 'cos:unauthorized');
  });

  it('clears only the auth token and emits cos:unauthorized in the browser', () => {
    mockBrowserStorage();
    memory.setItem(STORAGE_KEYS.AUTH_TOKEN, 'stale-jwt');
    memory.setItem(STORAGE_KEYS.AUTH_USER, '{"id":"user_1"}');
    memory.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-value');

    clearAuthTokenAndEmitUnauthorized();

    assert.equal(memory.getItem(STORAGE_KEYS.AUTH_TOKEN), null);
    assert.equal(memory.getItem(STORAGE_KEYS.AUTH_USER), '{"id":"user_1"}');
    assert.equal(memory.getItem(STORAGE_KEYS.REFRESH_TOKEN), 'refresh-value');
    assert.equal(dispatched.length, 1);
    assert.equal(dispatched[0].type, COS_UNAUTHORIZED_EVENT);
    assert.equal(dispatched[0] instanceof CustomEvent, true);
  });

  it('does not clear storage or emit when window is undefined (SSR)', () => {
    memory = createMemoryStorage();
    memory.setItem(STORAGE_KEYS.AUTH_TOKEN, 'stale-jwt');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      writable: true,
      value: memory,
    });
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    clearAuthTokenAndEmitUnauthorized();

    assert.equal(memory.getItem(STORAGE_KEYS.AUTH_TOKEN), 'stale-jwt');
  });

  it('registered axios interceptor clears token and emits on HTTP 401', async () => {
    mockBrowserStorage();
    memory.setItem(STORAGE_KEYS.AUTH_TOKEN, 'stale-jwt');

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = httpErrorAdapter(
      401,
      {
        success: false,
        message: 'Unauthorized: Authentication required or token invalid',
        data: null,
        errors: null,
      },
      'Unauthorized'
    );

    try {
      await assert.rejects(
        () => apiClient.get('/auth/me'),
        (err: unknown) => {
          assert.equal(err instanceof AppApiError, true);
          assert.equal((err as AppApiError).statusCode, 401);
          return true;
        }
      );
      assert.equal(memory.getItem(STORAGE_KEYS.AUTH_TOKEN), null);
      assert.equal(dispatched.length, 1);
      assert.equal(dispatched[0].type, 'cos:unauthorized');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('does not clear token or emit on HTTP 403', async () => {
    mockBrowserStorage();
    memory.setItem(STORAGE_KEYS.AUTH_TOKEN, 'valid-jwt');

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = httpErrorAdapter(
      403,
      {
        success: false,
        message: 'Forbidden',
        data: null,
        errors: null,
      },
      'Forbidden'
    );

    try {
      await assert.rejects(
        () => apiClient.get('/users'),
        (err: unknown) => {
          assert.equal(err instanceof AppApiError, true);
          assert.equal((err as AppApiError).statusCode, 403);
          return true;
        }
      );
      assert.equal(memory.getItem(STORAGE_KEYS.AUTH_TOKEN), 'valid-jwt');
      assert.equal(dispatched.length, 0);
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('does not clear token or emit on network errors (no HTTP response)', async () => {
    mockBrowserStorage();
    memory.setItem(STORAGE_KEYS.AUTH_TOKEN, 'valid-jwt');

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = async () => {
      throw Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });
    };

    try {
      await assert.rejects(() => apiClient.get('/health'));
      assert.equal(memory.getItem(STORAGE_KEYS.AUTH_TOKEN), 'valid-jwt');
      assert.equal(dispatched.length, 0);
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it('http.get still rejects AppApiError on 401 and does not return an envelope', async () => {
    mockBrowserStorage();
    memory.setItem(STORAGE_KEYS.AUTH_TOKEN, 'stale-jwt');

    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = httpErrorAdapter(
      401,
      {
        success: false,
        message: 'Unauthorized',
        data: null,
        errors: null,
      },
      'Unauthorized'
    );

    try {
      await assert.rejects(
        () => http.get('/auth/me'),
        (err: unknown) => {
          assert.equal(err instanceof AppApiError, true);
          assert.equal((err as AppApiError).statusCode, 401);
          return true;
        }
      );
      assert.equal(memory.getItem(STORAGE_KEYS.AUTH_TOKEN), null);
      assert.equal(dispatched.length, 1);
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });
});
