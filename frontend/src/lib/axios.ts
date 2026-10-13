import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '../constants/storage-keys';

export interface ApiErrorResponse {
  message?: string;
  code?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export class AppApiError extends Error {
  public statusCode: number;
  public code?: string;
  public errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT),
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Frozen M01-P02-T02: attach `Authorization: Bearer <token>` from
 * `localStorage[STORAGE_KEYS.AUTH_TOKEN]` (`cos_auth_token`).
 *
 * Client-only (`typeof window !== 'undefined'`). Empty/missing token is not
 * attached. Matches backend `@fastify/jwt` Bearer verification.
 *
 * `NEXT_PUBLIC_AUTH_COOKIE_NAME` is not read. Cookie vs localStorage, refresh-
 * token HTTP usage, attaching on public routes, and overwriting an existing
 * Authorization header: NOT SPECIFIED. Frozen as implemented: attach whenever
 * a non-empty client-side token exists.
 *
 * 401 clear + `cos:unauthorized` is frozen M01-P02-T04
 * (`clearAuthTokenAndEmitUnauthorized`).
 */
export function applyBearerTokenFromStorage(
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}

/**
 * Event name emitted after a browser-side HTTP 401 (frozen M01-P02-T04).
 * `useAuthSession` (M02-P02-T05) listens and clears Redux/`AUTH_USER`
 * in place. Redirect-on-401 remains NOT SPECIFIED (M03-P02-T03).
 */
export const COS_UNAUTHORIZED_EVENT = 'cos:unauthorized';

/**
 * Frozen M01-P02-T04: on HTTP 401 in the browser, clear the stored auth token
 * and emit `cos:unauthorized`.
 *
 * Token key is `STORAGE_KEYS.AUTH_TOKEN` (`cos_auth_token`) — the same key the
 * T02 request interceptor, `auth-slice`, and `useAuthSession` use.
 *
 * Client-only (`typeof window !== 'undefined'`). Does not refresh tokens.
 * Does not redirect. Does not call Redux `logout`. Does not clear
 * `AUTH_USER`, `REFRESH_TOKEN`, or cookies.
 *
 * AUTH_USER / cookie / refresh-token / session-expiry / redirect-on-401:
 * NOT SPECIFIED.
 */
export function clearAuthTokenAndEmitUnauthorized(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  window.dispatchEvent(new CustomEvent(COS_UNAUTHORIZED_EVENT));
}

apiClient.interceptors.request.use(applyBearerTokenFromStorage, (error: AxiosError) => {
  return Promise.reject(error);
});

// Response Interceptor: Standardize Responses & Error Handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || error.message || 'An unexpected error occurred';
      const appError = new AppApiError(message, status, data?.code, data?.errors);

      if (status === 401) {
        clearAuthTokenAndEmitUnauthorized();
      }

      return Promise.reject(appError);
    }

    if (error.request) {
      return Promise.reject(
        new AppApiError('Unable to connect to the server. Please check your network connection.', 0)
      );
    }

    return Promise.reject(new AppApiError(error.message || 'Request initialization failed.', 500));
  }
);

export default apiClient;
