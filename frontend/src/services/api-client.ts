import apiClient from '../lib/axios';
import type { AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types/api';

export type { ApiResponse, ApiSuccessResponse, ApiFailureResponse } from '../types/api';

/**
 * Typed HTTP helpers over the shared axios instance.
 *
 * Axios already unwraps `response.data` (the JSON body). These helpers therefore
 * resolve to the frozen backend envelope `ApiResponse<T>` — they do **not**
 * unwrap `data` a second time. 401 handling stays in `src/lib/axios.ts`
 * (frozen M01-P02-T04: clear `STORAGE_KEYS.AUTH_TOKEN` + emit
 * `cos:unauthorized`).
 *
 * `T` is the inner payload type (`envelope.data`), not the envelope itself.
 */
export const http = {
  get: async <T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> => {
    const response = await apiClient.get<ApiResponse<T>>(url, config);
    return response as unknown as ApiResponse<T>;
  },

  post: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response as unknown as ApiResponse<T>;
  },

  put: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.put<ApiResponse<T>>(url, data, config);
    return response as unknown as ApiResponse<T>;
  },

  patch: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.patch<ApiResponse<T>>(url, data, config);
    return response as unknown as ApiResponse<T>;
  },

  delete: async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.delete<ApiResponse<T>>(url, config);
    return response as unknown as ApiResponse<T>;
  },

  upload: async <T = unknown>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> => {
    const response = await apiClient.post<ApiResponse<T>>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response as unknown as ApiResponse<T>;
  },
};
