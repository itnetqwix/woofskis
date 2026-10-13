/**
 * Frontend environment schema (audited M01-P02-T01).
 *
 * Zod parses a snapshot of `process.env`. Defaults apply only when a key is
 * `undefined`. This module is not imported by `src/lib/axios.ts` or
 * `src/config/site.ts` today — those files read `process.env` directly.
 *
 * Keys currently in this schema:
 * - `NEXT_PUBLIC_APP_NAME` — default `Contest Operating System`
 * - `NEXT_PUBLIC_APP_DESCRIPTION` — default platform description string
 * - `NEXT_PUBLIC_APP_URL` — default `http://localhost:3000`
 * - `NEXT_PUBLIC_API_BASE_URL` — default `http://localhost:5000/api/v1`
 *   (aligned to frozen backend PORT 5000 + `/api/v1`; previously this default
 *   was `http://localhost:8000/api/v1`, which does not match cos-backend)
 * - `NEXT_PUBLIC_API_TIMEOUT` — string coerced to number; default `15000`
 * - `NEXT_PUBLIC_AUTH_COOKIE_NAME` — default `cos_auth_token`
 * - `NEXT_PUBLIC_REFRESH_COOKIE_NAME` — default `cos_refresh_token`
 * - `NODE_ENV` — `'development' | 'test' | 'production'`; default `'development'`
 *
 * Axios (`src/lib/axios.ts`) uses `process.env.NEXT_PUBLIC_API_BASE_URL` with
 * no fallback. If that env var is unset, `baseURL` is undefined.
 *
 * Auth cookie/header names in this schema are unused by axios. The request
 * interceptor (M01-P02-T02) reads localStorage `STORAGE_KEYS.AUTH_TOKEN`
 * (`cos_auth_token`), not `NEXT_PUBLIC_AUTH_COOKIE_NAME`. Cookie vs
 * localStorage and refresh-token HTTP usage: NOT SPECIFIED.
 *
 * Production / hosted API URL: NOT SPECIFIED.
 * CORS / cookie security flags: not frontend env keys (NOT SPECIFIED here).
 *
 * `.env.example` lists placeholders for the keys above. Do not commit real
 * secrets. Do not modify gitignored `.env.local`.
 */
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().default('Contest Operating System'),
  NEXT_PUBLIC_APP_DESCRIPTION: z
    .string()
    .default('High performance contest and tournament management platform'),
  NEXT_PUBLIC_APP_URL: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_API_BASE_URL: z.string().default('http://localhost:5000/api/v1'),
  NEXT_PUBLIC_API_TIMEOUT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('15000'),
  NEXT_PUBLIC_AUTH_COOKIE_NAME: z.string().default('cos_auth_token'),
  NEXT_PUBLIC_REFRESH_COOKIE_NAME: z.string().default('cos_refresh_token'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_API_TIMEOUT: process.env.NEXT_PUBLIC_API_TIMEOUT,
  NEXT_PUBLIC_AUTH_COOKIE_NAME: process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME,
  NEXT_PUBLIC_REFRESH_COOKIE_NAME: process.env.NEXT_PUBLIC_REFRESH_COOKIE_NAME,
  NODE_ENV: process.env.NODE_ENV,
});
