import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import axios, { type InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '../../src/constants/storage-keys';
import { apiClient, applyBearerTokenFromStorage } from '../../src/lib/axios';

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
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

function createConfig(): InternalAxiosRequestConfig {
  return {
    headers: new axios.AxiosHeaders(),
  } as InternalAxiosRequestConfig;
}

describe('M01-P02-T02 axios Bearer interceptor', () => {
  const originalWindow = globalThis.window;
  const originalLocalStorage = globalThis.localStorage;
  let memory: ReturnType<typeof createMemoryStorage>;

  function mockBrowserStorage() {
    memory = createMemoryStorage();
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      writable: true,
      value: globalThis,
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

  it('uses STORAGE_KEYS.AUTH_TOKEN value cos_auth_token', () => {
    assert.equal(STORAGE_KEYS.AUTH_TOKEN, 'cos_auth_token');
  });

  it('attaches Authorization: Bearer from cos_auth_token on the client', () => {
    mockBrowserStorage();
    memory.setItem(STORAGE_KEYS.AUTH_TOKEN, 'test-jwt-token');

    const config = applyBearerTokenFromStorage(createConfig());

    assert.equal(config.headers.Authorization, 'Bearer test-jwt-token');
  });

  it('does not attach Authorization when the token is missing', () => {
    mockBrowserStorage();

    const config = applyBearerTokenFromStorage(createConfig());

    assert.equal(config.headers.Authorization, undefined);
  });

  it('does not attach Authorization when the token is an empty string', () => {
    mockBrowserStorage();
    memory.setItem(STORAGE_KEYS.AUTH_TOKEN, '');

    const config = applyBearerTokenFromStorage(createConfig());

    assert.equal(config.headers.Authorization, undefined);
  });

  it('does not read a token from a different storage key', () => {
    mockBrowserStorage();
    memory.setItem(STORAGE_KEYS.REFRESH_TOKEN, 'refresh-value');
    memory.setItem('unrelated_key', 'other-token');

    const config = applyBearerTokenFromStorage(createConfig());

    assert.equal(config.headers.Authorization, undefined);
  });

  it('does not attach Authorization when window is undefined (SSR)', () => {
    memory = createMemoryStorage();
    memory.setItem(STORAGE_KEYS.AUTH_TOKEN, 'test-jwt-token');
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

    const config = applyBearerTokenFromStorage(createConfig());

    assert.equal(config.headers.Authorization, undefined);
  });

  it('registered axios interceptor attaches Bearer on apiClient requests', async () => {
    mockBrowserStorage();
    memory.setItem(STORAGE_KEYS.AUTH_TOKEN, 'test-jwt-token');

    const originalAdapter = apiClient.defaults.adapter;
    let capturedAuthorization: unknown;
    apiClient.defaults.adapter = async (config) => {
      const headers = config.headers;
      capturedAuthorization =
        headers && typeof headers.get === 'function'
          ? headers.get('Authorization')
          : headers?.Authorization;
      return {
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      await apiClient.get('/health');
      assert.equal(capturedAuthorization, 'Bearer test-jwt-token');
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });
});
