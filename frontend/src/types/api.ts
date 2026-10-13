/**
 * Frozen COS HTTP response envelope (M01-P02-T03).
 *
 * Matches M01-P01-T01 `cos-backend/src/utils/response.ts`:
 * `{ success, message, data, errors }` — the same four fields on success and error.
 *
 * Success:
 * - `success` is `true`
 * - `errors` is always `null`
 * - `data` is the payload (`T`; may be `null` if the backend passed `null`)
 *
 * Error:
 * - `success` is `false`
 * - `data` is always `null`
 * - `errors` is `null` or caller-supplied details
 *
 * NOT SPECIFIED (do not invent):
 * - detailed `errors` item schema beyond `unknown | null`
 *   (backend callers typically pass `null` or `{ field, message }[]`)
 * - top-level `timestamp` (not part of the envelope; health may put it in `data`)
 * - nested `{ error: { code, message } }` (removed prototype shape)
 * - top-level `meta` (pagination lives under `data.pagination`)
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T | null;
  errors: null;
}

export interface ApiFailureResponse {
  success: false;
  message: string;
  data: null;
  errors: unknown | null;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiFailureResponse;
