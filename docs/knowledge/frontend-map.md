# Frontend Architecture & Component Map

> **Canonical Path**: `/docs/knowledge/frontend-map.md`  
> **Repository**: [frontend](file:///D:/woofskis/frontend/)  
> **Framework**: Next.js 14.2 (App Router) + React 18 + TypeScript 5.6 + TailwindCSS 3.4 + Redux Toolkit 2.2 + TanStack Query 5.59  
> **Last Updated**: 2026-10-21

---

## 1. App Router Route Hierarchy

| Route Path | File Location | Purpose & Persona | Implementation Status |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Continuous single-video judging queue (`<ViewerContainer />`). `/?v=<submissionId>` is the public share URL and renders Open Graph and Twitter tags from the share preview. | `IMPLEMENTED` |
| `/media/submissions/[id]/thumbnail` | `src/app/media/submissions/[id]/thumbnail/route.ts` | Stable public thumbnail for link previews. Redirects to a public image, proxies an expiring download, or falls back to the site logo. Private video objects are not served. | `IMPLEMENTED` |
| `/login` | `src/app/(auth)/login/page.tsx` | Unified login page for Creators, Brand Admins, and Super Admins. | `IMPLEMENTED` |
| `/register` | `src/app/(auth)/register/page.tsx` | Dynamic registration page supporting both Creator and Brand sign-up tabs. | `IMPLEMENTED` |
| `/creator` | `src/app/(dashboard)/creator/page.tsx` | Creator Studio. Tabs show Performance Overview & Metrics, Contests, or Your Submissions. The metrics tab is the default. | `IMPLEMENTED` |
| `/creator/friends` | `src/app/(dashboard)/creator/friends/page.tsx` | Creator friends list, name search, request actions, and the chat inbox. CREATOR only. | `IMPLEMENTED` |
| `/creator/friends/[friendshipId]` | `src/app/(dashboard)/creator/friends/[friendshipId]/page.tsx` | One accepted-friend conversation. Same CREATOR RoleGuard as `/creator/friends`. | `IMPLEMENTED` |
| `/admin/moderation` | `src/app/(dashboard)/admin/moderation/page.tsx` | Split-screen video moderation review queue and decision workflows. | `IMPLEMENTED` |
| `/admin/contests` | `src/app/(dashboard)/admin/contests/page.tsx` | Contest management table, lifecycle state badges, and contest creation modal. Banner upload, contest timezone, and the review step use `ContestPresentation`. | `IMPLEMENTED` |
| `/admin/leaderboard` | `src/app/(dashboard)/admin/leaderboard/page.tsx` | Admin leaderboard for ACTIVE contests. Uses `GET /contests/active` and `GET /contests/:id/leaderboard`. | `IMPLEMENTED` |
| `/admin/categories` | `src/app/(dashboard)/admin/categories/page.tsx` | Admin video category list, create, edit, activate, and safe delete. | `IMPLEMENTED` |
| `/admin/brands` | `src/app/(dashboard)/admin/brands/page.tsx` | Brand theme customizer (colors, logos, typography, headers). | `IMPLEMENTED` |
| `/super-admin` | `src/app/(dashboard)/super-admin/page.tsx` | Multi-tenant overview. Tenant fleet and status from `GET /super-admin/organizations` (`useSuperAdminOrganizations`); Suspend opens `SuspendOrganizationDialog` (required reason); Reactivate calls reinstate. Compliance notices are still a local prototype. | `IMPLEMENTED` |
| `/leaderboard` | `src/app/(viewer)/leaderboard/page.tsx` | Public scoreboard for ACTIVE contests only. Ranks come from the leaderboard API. Search does not re-rank. | `IMPLEMENTED` |

---

## 2. Feature Modules Breakdown

### 2.1 `features/judging` (Community Voting Engine)
- **`components/viewer-container.tsx`**: High-level wrapper coordinating video playback, the glass rating bar, the unrated-end hint, and mute state.
- **`components/video-player.tsx`**: Custom video player component with play/pause, volume controls, buffering indicator, and full-screen support.
- **`components/rating-modal.tsx`**: Unused by the live judging path. The rate API still accepts 1–10.
- **`components/star-rating.tsx`**: Shared star control. The judging bar uses 5 stars. Filled stars use `#8BC144`.
- **`components/star-celebration.tsx`**: Pointer-events-none stars that rise after a successful rating. Reduced motion fades them.
- **`components/previous-rated-card.tsx`**: Last rated video thumbnail, title, the viewer's stars, and the community score. Tap returns to that video. `variant="panel"` is the persistent left-column card on tablet/desktop (≥768px), where the judging page uses a two-column layout (last rated ~31%, player + rating panel ~67%). Phones keep the auto-hiding overlay.
- **`components/rating-bar.tsx`**: Full-width glass bar under the header. Five stars submit 1–5 through the existing rate API. Skip appears when an unrated video ends.
- **`components/unrated-end-dialog.tsx`**: First unrated ending on a device. "Don't show this again" is stored in `localStorage` (`cos_unrated_end_hint_hidden`).
- **`components/score-reveal-overlay.tsx`**: Consensus overlay component. A successful rating advances immediately; the live path does not wait on this overlay.
- **`components/queue-completed.tsx`**: End-of-queue view shown when all active contest videos have been rated.
- **`components/keyboard-shortcuts-modal.tsx`**: Help modal detailing keyboard shortcuts (`1-5` rate, `Space`, `M`, `N`, `P`, `R`).
- **`hooks/use-contest-queue.ts`**: Queue state. A successful rating calls the rate API and advances. An unrated video stays when playback ends. Keys `1-5` submit that score.
- **`components/share-sheet.tsx`**: Copy Link, WhatsApp, Message, Facebook, and Email. Message uses the Web Share API when available and copies the public page message on desktop otherwise. Shared URLs are `/?v=<submissionId>`.
- **`lib/share-metadata.ts`**: Builds Open Graph and Twitter tags. `og:image` is the stable `/media/submissions/[id]/thumbnail` URL, not a presigned download or object key.

### 2.2 `features/submissions` (Creator Hub)
- **`components/upload-modal.tsx`**: Video upload dialog. Client validates MP4/WebM/MOV, ≤100MB, ≤60s, then **presign → PUT S3 → complete**. Video bytes do not go through Fastify.
- **`components/submissions-table.tsx`**: Data table listing creator's uploaded videos, status badges (`APPROVED`, `PENDING_REVIEW`, `REJECTED`), community score, vote counts, and preview triggers.
- **`components/creator-metrics-cards.tsx`**: Summary cards derived from `GET /submissions/me` (M06-P04-T07). Choosing a card filters submissions and shows the Your Submissions tab.
- **`components/creator-contest-board.tsx`**: Compact contest grid. A card opens a dialog with `ContestPresentation`, requirements, and Submit entry while the contest is `ACTIVE`.
- **`components/video-preview-modal.tsx`**: Modal for inspecting video playback and metadata.
- **`components/delete-submission-dialog.tsx`**: Confirms creator delete with the video title. The list updates only after `DELETE /submissions/:id` succeeds.
- **`hooks/use-creator-submissions.ts`**: Loads `GET /submissions/me`. `cos_creator_submissions_v1` is not the primary source. Delete calls `DELETE /submissions/:id` and removes the row only after success.

### 2.3 `features/admin` (Moderation & Contest Operations)
- **`components/moderation-split-viewer.tsx`**: Split-screen moderation UI with video playback in left pane and compliance checklist / actions in right pane.
- **`components/reject-reason-dialog.tsx`**: Dialog capturing rejection categories and customizable feedback notes for creators.
- **`components/moderation-audit-log-modal.tsx`**: Modal displaying immutable audit log of administrative decisions.
- **`components/contest-create-modal.tsx`**: Wizard for creating new contests with dates, categories, prize pools, and rule descriptions.
- **`components/contests-management-table.tsx`**: Table listing tenant contests with lifecycle status controls.
- **`components/brand-theme-form.tsx`**: Visual theme customizer. Save (M04-P03-T03) calls `PUT /api/v1/organizations/:id/branding` with `primaryColor`, `logoUrl`, and optional `accentColor` / `tagline`. Slug, name, domain, and `backgroundStyle` are not branding API fields.
- **`hooks/use-tenant-theme.ts`**: Active slug loads `GET /api/v1/organizations/:slug/branding` (M04-P03-T02). API tokens are the primary theme source. `cos_brands_config_v1` remains the local catalog because M04 has no list endpoint. `cos_org_branding_cache_v1` is an optional cache.
- **`components/tenant-suspension-overlay.tsx`**: Guard overlay displayed when `activeBrand.status` is `SUSPENDED`. Since M10 that status comes from `Organization.status` on the branding API (merged in `mergeApiOrganizationBranding`); `useTenantCompliance` no longer writes suspension to localStorage.

### 2.4 `features/leaderboard` (Public Rankings) — implemented M09
- **`components/leaderboard-podium.tsx`**: Visual podium highlighting 1st, 2nd, and 3rd place submissions with medal badges, crown icons, and prize allocations.
- **`components/leaderboard-table.tsx`**: Ranking table for 4th+ place submissions (or full list in full_table mode) with score, verified votes, and video preview trigger. Empty state rendered when no submissions match filters.
- **`components/leaderboard-filters.tsx`**: Contest dropdown (incorporating stored tenant contests), category filter tabs, search filter box, and view mode switcher.
- **`components/leaderboard-video-modal.tsx`**: Vertical 9:16 video modal for inspecting video playback and metadata.
- **`lib/leaderboard-flow.ts`**: Utilities for selecting contest ID, mapping API leaderboard items to view models with prize tiers, and building contest banner metadata.
- **`hooks/use-leaderboard.ts`**: Hook wired to `GET /api/v1/contests/:id/leaderboard` via `src/services/leaderboard-api.ts`. Computes dynamic ranking by `communityScore` desc then `totalVotes` desc, extracts podium, and supports search filtering and loading/error states.

### 2.5 `features/auth` (Authentication Forms)
- **`components/login-form.tsx`**: Existing email/password UI (local `useState`, not a Formik instance). Wired (M02-P02-T02) to `POST /auth/login` via `useAuthSession.login`. Stores real JWT + mapped `AuthUser`. `rememberMe` stays UI-only (NOT SPECIFIED). Forgot-password dialog remains a stub (password reset PLANNED).
- **`components/creator-register-form.tsx`**: Existing creator UI. Wired (M02-P02-T03) to `POST /auth/register/creator`. Maps `fullName` → `name`. Handle/`avatarUrl`/`category`/`bio`/`agreeToTerms` remain prototype UI fields and are **not** POSTed (M02-P01-T05/T06).
- **`components/brand-register-form.tsx`**: Not mounted. Brand registration is removed from the product flow (2026-09-29). See [deployment-model.md](deployment-model.md).
- **`hooks/use-auth-session.ts`**: Production auth path uses `src/services/auth-api.ts`. Hydrates from `GET /auth/me` when `STORAGE_KEYS.AUTH_TOKEN` is present (M02-P02-T05). `DEMO_PERSONAS` / `MOCK_AUTH_USERS` are gated out of login/register (M02-P02-T06). `loginAsDemoPersona` throws. Backend 401/409 map to form error dictionaries (M02-P02-T07). M02-P03 live verification: creator/brand register, login, `/auth/me` hydration, logout clears `cos_auth_token`, invalid JWT → 401 + token clear. Axios 401 interceptor still does **not** redirect (frozen M01-P02-T04). RoleGuard unauthenticated redirects are a separate client-route concern (M03-P02-T03).
- **`lib/map-auth-user.ts`**: Maps API `name` → `displayName`. Compatibility role aliases **kept in M03-P02**: `BRAND_ADMIN` → `ORGANIZATION_ADMIN`, `SUPER_ADMIN` → `PLATFORM_ADMIN`. RoleGuard matches these session aliases (not Prisma JWT names). `passwordHash` is stripped. `username` is a client-only email local-part fallback (never POSTed).

### 2.6 Route guards (`components/auth`) — frozen M03-P02

There is **no** dashboard `layout.tsx` RoleGuard. Each protected page wraps itself:

| Route | File | Session roles allowed | Unauthenticated | Unauthorized |
|---|---|---|---|---|
| `/creator` | `src/app/(dashboard)/creator/page.tsx` | `CREATOR` | `/login?redirect=/creator` | 403 fallback (no redirect) |
| `/creator/friends` | `src/app/(dashboard)/creator/friends/page.tsx` and `src/app/(dashboard)/creator/friends/[friendshipId]/page.tsx` | `CREATOR` | `/login?redirect=/creator/friends` | 403 fallback (no redirect) |
| `/admin/moderation` | `src/app/(dashboard)/admin/moderation/page.tsx` | `ORGANIZATION_ADMIN`, `PLATFORM_ADMIN` | `/login` | `/` |
| `/admin/contests` | `src/app/(dashboard)/admin/contests/page.tsx` | `ORGANIZATION_ADMIN`, `PLATFORM_ADMIN` | `/login` | `/` |
| `/admin/brands` | `src/app/(dashboard)/admin/brands/page.tsx` | `ORGANIZATION_ADMIN`, `PLATFORM_ADMIN` | `/login` | `/` |
| `/super-admin` | `src/app/(dashboard)/super-admin/page.tsx` | `PLATFORM_ADMIN` | `/login` | `/login?error=unauthorized_platform_access` |

- Policy source: `src/components/auth/role-guard-policy.ts`. `RoleGuard` reads Redux `auth.user.role` / token after `useAuthSession` hydration from `GET /auth/me`.
- Backend JWT `BRAND_ADMIN`/`SUPER_ADMIN` are equivalent to the aliases for matching only. Stored session role names are unchanged.
- `/creator` does **not** allow SUPER_ADMIN (Ch 11.6 primary users = Creators; extra grant **NOT SPECIFIED**).
- Prototype extras `MODERATOR`, `organizer`, `judge`, `superadmin` are **not** in production allow lists (not Prisma `Role`).
- Public `/` and `/leaderboard` remain unguarded (visitor journey).
- **M03-P03 matrix (verified)**: each protected route × {unauthenticated, VIEWER, CREATOR, ORGANIZATION_ADMIN/BRAND_ADMIN, PLATFORM_ADMIN/SUPER_ADMIN} matches the table above. Unauthenticated redirects to `/login` (creator keeps `?redirect=/creator`). Unauthorized `/admin/*` → `/`; unauthorized `/super-admin` → `/login?error=unauthorized_platform_access`; unauthorized `/creator` → 403 fallback (`redirectTo: null`). Axios 401 interceptor still does not redirect.

---

## 3. State Management & Data Flow Architecture

### 3.1 Redux Toolkit Store (`src/store`)
- **`slices/auth-slice.ts`**: Holds authenticated user session (`user`, `token`, `isAuthenticated`, `role`).
- **`slices/ui-slice.ts`**: Manages global UI states (sidebar expanded/collapsed, active modals, toast notifications).

### 3.2 Server State & Network Ingestion (`src/lib/axios.ts` + `src/services/api-client.ts`)
- Axios instance is created in `src/lib/axios.ts` with `baseURL = process.env.NEXT_PUBLIC_API_BASE_URL` and `timeout = Number(process.env.NEXT_PUBLIC_API_TIMEOUT)`. There is **no** `NEXT_PUBLIC_API_URL` key and **no** axios fallback URL.
- `src/services/api-client.ts` wraps that instance (`http.get/post/put/patch/delete/upload`). Envelope typing is frozen **M01-P02-T03** (`ApiResponse<T>` matches the backend `{ success, message, data, errors }` body). `http.*` methods return `Promise<ApiResponse<T>>` where `T` is the inner `data` payload. They do **not** unwrap `data` a second time. 401 handling is frozen **M01-P02-T04**.
- Request interceptor (frozen **M01-P02-T02**) attaches `Authorization: Bearer <token>` from localStorage key `STORAGE_KEYS.AUTH_TOKEN` (`cos_auth_token`). It does **not** read `NEXT_PUBLIC_AUTH_COOKIE_NAME`.

### 3.2.1 Frontend environment (`src/config/env.ts` + `.env.example`) — audited M01-P02-T01

Zod schema in `src/config/env.ts` lists the keys below. **This module is not imported** by axios or `site.ts` today; those files read `process.env` directly. Defaults apply only if/when `env.ts` is parsed and a key is `undefined`.

| Key | In `env.ts`? | Axios / site usage | Current default / template | Notes |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Yes | Unused by axios. `site.ts` hardcodes name. | `Contest Operating System` | Listed in `.env.example`. |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Yes | Unused by axios. `site.ts` hardcodes description. | existing description string | Listed in `.env.example`. |
| `NEXT_PUBLIC_APP_URL` | Yes | `site.ts` uses this env var, else `http://localhost:3000` | `http://localhost:3000` | Matches `next dev` / Docker published port **3000**. |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `src/lib/axios.ts` `baseURL` (no fallback) | **`http://localhost:5000/api/v1`** (aligned M01-P02-T01; previously template/default was `http://localhost:8000/api/v1`) | Matches frozen backend `PORT` 5000 + `/api/v1`. If unset at runtime, axios `baseURL` is `undefined`. Production build sets `NEXT_PUBLIC_API_BASE_URL=https://api.woofskis.com/api/v1` (`frontend/Dockerfile.prod`). Local `.env.example` remains `http://localhost:5000/api/v1`. |
| `NEXT_PUBLIC_API_TIMEOUT` | Yes | `Number(process.env.NEXT_PUBLIC_API_TIMEOUT)` | `15000` | If unset, `Number(undefined)` is `NaN`. Timeout policy: **NOT SPECIFIED** beyond this existing key. |
| `NEXT_PUBLIC_AUTH_COOKIE_NAME` | Yes | **Not read** by axios | `cos_auth_token` | Axios request interceptor (M01-P02-T02) reads localStorage `STORAGE_KEYS.AUTH_TOKEN` (`cos_auth_token`), not this env key. Cookie vs localStorage: **NOT SPECIFIED**. |
| `NEXT_PUBLIC_REFRESH_COOKIE_NAME` | Yes | **Not read** by axios | `cos_refresh_token` | Refresh-token HTTP transport: **NOT SPECIFIED**. |
| `NODE_ENV` | Yes | Next.js / Redux `devTools` / Query devtools | `development` | Enum: `development`, `test`, or `production`. |

`.env.example` (M01-P02-T01) lists placeholders for those keys only. Copy to `.env.local` (gitignored via `.env*.local`). A non-local `.env` is **not** ignored by the current frontend `.gitignore`. Docker Compose does not pass `NEXT_PUBLIC_API_*`. Do not commit real secrets; do not modify gitignored `.env.local`.

Local FE→BE ports (**3000** / **5000**) are documented briefly in `frontend/README.md` (M01-P02-T05).

### 3.2.2 Axios Bearer request interceptor (`src/lib/axios.ts`) — frozen M01-P02-T02

`applyBearerTokenFromStorage` is the axios request interceptor. Audited behavior:

| Condition | `Authorization` header |
|---|---|
| Browser + non-empty `localStorage['cos_auth_token']` | `Bearer <token>` |
| Browser + missing or empty token | not set |
| Token stored under another key (e.g. `cos_refresh_token`) | not set |
| No `window` (SSR / Node) | not set |

- Storage key is `STORAGE_KEYS.AUTH_TOKEN` (`cos_auth_token`), the same key `auth-slice` / `useAuthSession` write. M02-P02 writers store the real backend JWT (no `cos_jwt_*` mock tokens on the production auth path).
- Header format matches backend `@fastify/jwt` / `authenticate` (`Authorization: Bearer <jwt>`).
- `NEXT_PUBLIC_AUTH_COOKIE_NAME` is **not** read. Cookie vs localStorage: **NOT SPECIFIED**.
- Refresh-token HTTP usage (`STORAGE_KEYS.REFRESH_TOKEN`): **NOT SPECIFIED**.
- Whether to skip attaching on public routes, or to preserve a caller-supplied `Authorization` header: **NOT SPECIFIED**. Frozen as implemented: attach whenever a non-empty client-side token exists.
- Response 401 clear + `cos:unauthorized` is frozen **M01-P02-T04** (see 3.2.4). Request interceptor behavior here is unchanged.

### 3.2.3 Frontend `ApiResponse` envelope (`src/types/api.ts` + `src/services/api-client.ts`) — frozen M01-P02-T03

Aligned with M01-P01-T01 `backend/src/utils/response.ts`. Canonical type lives in `src/types/api.ts`; `api-client.ts` re-exports it and types `http.*` return values as `Promise<ApiResponse<T>>`.

| Field | Success | Error |
|---|---|---|
| `success` | `true` | `false` |
| `message` | string (required) | string (required) |
| `data` | `T \| null` | always `null` |
| `errors` | always `null` | `unknown \| null` |

**Removed prototype fields (not in the backend envelope):** top-level `timestamp`; nested `{ error: { code, message, details? } }`; top-level `meta`. Pagination remains `data.pagination` (`src/types/common.ts` `PaginatedResponse`).

**Consumers:** feature API modules call `http` and read the frozen envelope. M11 retired critical-path mocks. Axios `ApiErrorResponse` in `src/lib/axios.ts` (`code`, `statusCode`, `errors?: Record<string, string[]>`) is **unchanged** — interceptor error-object mapping is **NOT SPECIFIED** beyond the JSON envelope. 401 clear is frozen **M01-P02-T04** (see 3.2.4); HTTP errors still reject as `AppApiError`.

**NOT SPECIFIED:** detailed `errors` item schema (backend typically passes `null` or `{ field, message }[]`); whether HTTP error statuses should resolve as `ApiFailureResponse` vs throw `AppApiError` (current axios interceptor still rejects); unwrapping `envelope.data` for callers.

### 3.2.4 Axios 401 response interceptor (`src/lib/axios.ts`) — frozen M01-P02-T04

`clearAuthTokenAndEmitUnauthorized` runs from the axios **error** interceptor when `error.response.status === 401`.

| Condition | Token (`STORAGE_KEYS.AUTH_TOKEN` / `cos_auth_token`) | `cos:unauthorized` event |
|---|---|---|
| Browser + HTTP 401 | `localStorage.removeItem` (idempotent if missing) | `window.dispatchEvent(new CustomEvent('cos:unauthorized'))` |
| Browser + HTTP 403 / other response statuses | unchanged | not emitted |
| Network / no `error.response` | unchanged | not emitted |
| No `window` (SSR / Node) | unchanged | not emitted |

- Storage key is `STORAGE_KEYS.AUTH_TOKEN` (`cos_auth_token`), the same key T02 reads and `auth-slice` / `useAuthSession` write. Previously the interceptor used a hardcoded `'cos_auth_token'` string; it now uses the constant.
- The request still **rejects** as `AppApiError` with `statusCode` 401. This does not return a success `ApiResponse` envelope (T03 contract preserved).
- Does **not** clear `AUTH_USER`, `REFRESH_TOKEN`, or cookies.
- Does **not** call Redux `logout`, does **not** redirect, does **not** refresh tokens.
- `useAuthSession` (M02-P02-T05) listens to `cos:unauthorized` and clears Redux/`AUTH_USER` in place. It does **not** redirect. RoleGuard on protected dashboard routes then treats the cleared session as unauthenticated (M03-P02-T03).

**NOT SPECIFIED:** cookie vs localStorage; refresh-token HTTP; whether to emit only when a token was present. Interceptor still does not clear `AUTH_USER` (frozen). Session hook teardown on the event is M02-P02-T05. RoleGuard dashboard redirects are M03-P02-T03, not this interceptor.

### 3.2.5 Local FE → BE ports (`frontend/README.md`) — documented M01-P02-T05

Local development uses two processes. The frontend README records this pairing; this section matches the inspected code (no invented hosts or proxies).

| Process | Default port | Evidence in code |
|---|---|---|
| Frontend Next.js | **3000** | `package.json` `dev` is `next dev` (no `-p`). `site.ts` / `NEXT_PUBLIC_APP_URL` fallback `http://localhost:3000`. `Dockerfile.dev`, `Dockerfile.prod`, and both Compose files publish/EXPOSE **3000**. |
| Backend Fastify | **5000** | `SYSTEM_CONSTANTS.DEFAULT_PORT` / `env.PORT` default. Routes under `/api/v1`. |

Axios `baseURL` is `NEXT_PUBLIC_API_BASE_URL` (local template `http://localhost:5000/api/v1`). `next.config.mjs` has **no** rewrite/proxy to the backend.

**Unused / not a contract:** `src/constants/api-routes.ts` is not imported anywhere. It is prototype path constants (including `/auth/register`, `/auth/logout`, `/auth/refresh`, `/teams`, `/users/profile`) and is **not** the live API map. Canonical contracts remain [`api-map.md`](file:///D:/woofskis/docs/knowledge/api-map.md).

**Auth consumer (M02-P02):** `src/services/auth-api.ts` is the production consumer of `http` / `ApiResponse` for `/auth/register/creator`, `/auth/register/brand`, `/auth/login`, and `/auth/me`. It returns the frozen envelope and does not unwrap `data` a second time. `useAuthSession` then reads `envelope.data` after `success` checks.

**NOT SPECIFIED:** production/hosted API URL; same-origin proxy; cookie vs localStorage session; CORS allowed-origin list (backend `src/plugins/cors.ts` currently hardcodes `origin: '*'`).

**M12-P02-T02:** frontend `console.*` calls do not print `cos_auth_token`, `Authorization`, or `passwordHash`. The token remains in `localStorage` under `STORAGE_KEYS.AUTH_TOKEN` (`cos_auth_token`). `cos_auth_updated` still includes the token in its event detail so `useAuthSession` can sync tabs; that event is not a log line. `.gitignore` ignores `.env` and `.env.*` and keeps `.env.example`.

### 3.3 Offline Resilience & Mock Data Strategy
To support offline development and rapid UI validation, the frontend currently implements a dual-mode strategy:
1. **Primary**: Admin contests use `GET/POST/PATCH /api/v1/contests` (M05). Creator submissions use `GET /submissions/me` and presign → S3 → complete (M06). Moderation queue, approve, reject, and audit logs use the M07 admin APIs. The header pending badge uses that queue through React Query. Judging loads `GET /contests/:id/queue` and posts ratings to the M08 rate API. Leaderboard rows come from `GET /contests/:id/leaderboard` (M09). Super-admin organizations use the M10 APIs. `cos_auth_token` is the session token. `cos_viewer_muted_preference` is the mute preference.
2. **Retained client state (M11)**: Brand switcher catalog (`cos_brands_config_v1`) because there is no public organization list. Optional branding cache. Optional `cos_contests_v1` UUID pointer, not seeded. Compliance warnings (`cos_tenant_warnings_v1`) have no API. Moderation card lifecycle (`cos_contest_lifecycle_v1`) is not a contest-status API. Flag and bulk moderation stay local because those routes do not exist. Podium prize amounts are presentation constants (payout is out of MVP).
3. **Removed from critical paths (M11)**: `mock-videos.ts`, `mock-auth-users.ts`, seeded `DEFAULT_CONTESTS_LIST`, leaderboard row fixtures, sample-video upload, and demo impersonation (`password123`). Creator contest discovery remains **NOT SPECIFIED**.
