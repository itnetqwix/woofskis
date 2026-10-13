# Backend Architecture & Module Map

> **Canonical Path**: `/docs/knowledge/backend-map.md`  
> **Repository**: [cos-backend](file:///D:/woofskis/cos-backend/)  
> **Framework**: Fastify 5.12 + TypeScript 5.9 + Prisma ORM 6.4 + PostgreSQL (Neon) + Zod 4.6 + Fastify-JWT 10.2  
> **Last Updated**: 2026-09-22

---

## 1. Fastify Application Architecture

The backend application is structured as a Clean Architecture / Repository Pattern service:

```
cos-backend/src/
├── app.ts                  # Frozen plugin order (M01-P01-T03): cors → helmet → prisma → jwt → swagger → routes
├── server.ts               # Process bootstrapper, port listening (PORT=5000), graceful exit
├── config/                 # Frozen env.ts (M01-P01-T02), constants.ts, database.ts
├── plugins/                # Fastify plugins (cors, helmet, jwt, prisma, swagger)
├── middleware/             # auth.middleware.ts (JWT & RBAC), error.middleware.ts
├── routes/                 # index.ts (Prefix: /api/v1)
├── schemas/                # auth.schema.ts, user.schema.ts (Zod + Fastify swagger schemas)
├── controllers/            # auth.controller.ts, user.controller.ts
├── services/               # auth.service.ts, user.service.ts
├── repositories/           # user.repository.ts
├── types/                  # Fastify module augmentations, DTO interfaces
└── utils/                  # response.ts (sendSuccess, sendError), sanitize.ts
```

---

## 2. Fastify Plugins & System Capabilities

| Plugin | File Location | Purpose & Configuration | Status |
|---|---|---|---|
| **CORS** | `src/plugins/cors.ts` | Registers `@fastify/cors` with hardcoded `origin: '*'`, `credentials: true`. Does **not** read `CORS_ORIGIN` (that key is absent from `env.ts`). Allowed-origin list: **NOT SPECIFIED**. | `IMPLEMENTED` |
| **Helmet** | `src/plugins/helmet.ts` | Sets secure HTTP response headers via `@fastify/helmet`. `contentSecurityPolicy` and `crossOriginEmbedderPolicy` are `false`. A stricter CSP is **NOT SPECIFIED**. | `IMPLEMENTED` |
| **Rate limit** | `src/plugins/rate-limit.ts` | `@fastify/rate-limit`, `global: false`, in-memory store, `onRequest`. Registered inside `routes/index.ts` so the frozen `buildApp()` order is unchanged. Auth writes: 10 / 15 min per IP per route. Rating POST: 60 / 1 min per IP. Both are engineering defaults (`RATE_LIMIT_DEFAULTS`). Exceeded → 429 frozen envelope. Redis and `trustProxy` are not used. | `IMPLEMENTED` |
| **JWT** | `src/plugins/jwt.ts` | Registers `@fastify/jwt` using `env.JWT_SECRET` and `SYSTEM_CONSTANTS.JWT_EXPIRES_IN` (`7d`, not an env var); decorates `fastify.authenticate`. | `IMPLEMENTED` |
| **Prisma** | `src/plugins/prisma.ts` | Initializes and decorates `fastify.prisma` with global connection lifecycle hooks. | `IMPLEMENTED` |
| **Swagger / OpenAPI** | `src/plugins/swagger.ts` | Generates interactive OpenAPI 3.0 API documentation at `/docs` (UI) and `/docs/json` (spec). Not `/documentation`. | `IMPLEMENTED` |

### Plugin registration order (`src/app.ts`) — frozen M01-P01-T03

`buildApp()` registers in this sequence:

1. `setErrorHandler(globalErrorHandler)` (not a plugin)
2. `corsPlugin`
3. `helmetPlugin`
4. `prismaPlugin`
5. `jwtPlugin`
6. `swaggerPlugin`
7. `routes` with prefix `/api/v1`

A required business/source order is **NOT SPECIFIED**. The M01-P01-T03 task text lists jwt before prisma; the code registers prisma before jwt. Neither plugin declares Fastify `dependencies` on the other, and neither plugin file imports the other. Relative prisma/jwt order is **NOT SPECIFIED**; the existing implementation order is frozen (not swapped).

Technical constraint (library, not a business rule): swagger is registered **before** routes so `@fastify/swagger` can collect route schemas. Helmet currently sets `contentSecurityPolicy: false` and `crossOriginEmbedderPolicy: false`; whether those must stay disabled is **NOT SPECIFIED**.

---

## 2.1 Environment configuration (`src/config/env.ts`) — frozen M01-P01-T02

`dotenv.config()` loads `.env`, then Zod `safeParse`s `process.env`. Invalid parse → log + `process.exit(1)`.

| Key | In `env.ts`? | Parse-time required? | Current default / behavior | Used by |
|---|---|---|---|---|
| `PORT` | Yes | No | Coerced number; default `SYSTEM_CONSTANTS.DEFAULT_PORT` **5000**. `server.ts` listens on `env.PORT` / `0.0.0.0`. Dockerfile also `ENV PORT=5000` and `EXPOSE 5000`. | `src/server.ts` |
| `DATABASE_URL` | Yes | No | `z.string()` defaulting to `process.env.DATABASE_URL \|\| ''` (empty string if unset). Fastify startup does **not** fail if missing. Prisma still reads it via `schema.prisma` `env("DATABASE_URL")` and `src/config/database.ts` `datasourceUrl`. | Prisma CLI + `database.ts` |
| `JWT_SECRET` | Yes | No | `z.string()` with a hardcoded fallback in `env.ts` when the key is missing. Empty string is accepted if the var is set blank. **M12-P01-T03 review:** expiry stays `7d`; claims stay `{ id, email, role, organizationId }`; this fallback is unchanged. Minimum length, rotation, and failing boot without a secret: **NOT SPECIFIED**. | `src/plugins/jwt.ts` |
| `CORS_ORIGIN` | **No** | N/A — key does not exist | Not validated, not exported, not read. CORS origin is hardcoded `'*'` in `src/plugins/cors.ts`. Allowed-origin list: **NOT SPECIFIED**. | none |
| `NODE_ENV` | Yes | No | Enum `'development' \| 'production' \| 'test'`; default `'development'`. Also set in Dockerfile as `production`. | `app.ts`, `database.ts`, `logger.ts`, `error.middleware.ts` |
| `LOG_LEVEL` | Yes | No | String; default `'info'`. | `app.ts` logger, `logger.ts` |

`.env.example` lists placeholders for `PORT`, `NODE_ENV`, `DATABASE_URL`, `JWT_SECRET`, `LOG_LEVEL`, and M06 AWS keys (`AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). `CORS_ORIGIN` is omitted. `cos-backend/.gitignore` ignores `.env` / `.env.*` and un-ignores `.env.example`. Do not commit real secrets.

AWS keys are optional at `env.ts` parse time (empty-string defaults). `S3StorageAdapter` refuses to sign when region/bucket are empty. There is no local-filesystem fallback. **M12-P01-T04:** `PutObjectCommand` does not set an ACL or `public-read`. Presign TTL is an engineering default of 900 seconds. `getPublicUrl` stores an unsigned virtual-hosted reference. Playback responses sign a GET for `Submission.objectKey` at response time (900s engineering default). Signed URLs are not stored. Bucket CORS and Block Public Access stay outside this repo. `.gitignore` ignores `.env` and `.env.*` and keeps `.env.example` (M12-P02-T03). The frontend repo uses the same ignore rule.

---

## 3. Middleware & Security Pipeline

### 3.1 Authentication & RBAC Guard (`src/middleware/auth.middleware.ts`) — frozen M03-P01-T01
- **`authenticate`**: Verifies JWT Bearer token via `request.jwtVerify()`. Attaches decoded `JWTPayload` (`id`, `email`, `role`, `organizationId`) to `request.user`. Missing/invalid token → **401** frozen envelope via `sendError`. Does **not** check roles. `fastify.authenticate` (jwt plugin decorate) is this same function (duplicate inline hook removed).
- **`sanitizeUser`** (`src/utils/sanitize-user.ts`, M12-P02-T01): drops `passwordHash` from user objects returned by login, both register methods, `getCurrentUser`, `getUserProfile`, and the user list. Repository selects on public reads already omit the column. Login still loads the hash in order to compare it, then strips it before the response.
- **`authorizeRoles(...allowedRoles: Role[])`**: Higher-order `onRequest` hook used **after** `fastify.authenticate`. Allowed values are Prisma `Role`: `SUPER_ADMIN`, `BRAND_ADMIN`, `CREATOR`, `VIEWER`. No user → **401**. Role not in the allow-list → **403** frozen envelope via `sendError`. `requireRoles` is an alias of `authorizeRoles`.
- **JWT typing**: `src/types/auth.ts` `JWTPayload` + `src/types/fastify.d.ts` FastifyJWT `payload`/`user`. Frontend prototype aliases `ORGANIZATION_ADMIN` / `PLATFORM_ADMIN` are **not** JWT claims.
- **Fine-grained permission table** beyond the role enum: **NOT SPECIFIED** (do not invent).
- **403 envelope (M03-P01-T03)**: Wrong-role replies use `sendError(..., HTTP_STATUS.FORBIDDEN)` so the body is the frozen M01 envelope `{ success: false, message, data: null, errors: null }`. No envelope-level `timestamp`. No nested `{ error: { code, message } }`.
- **Route application**: `GET /auth/me` remains any authenticated role. `GET /users` and `GET /users/:id` are `SUPER_ADMIN` only (M03-P01-T02).
- **M03-P03 matrix (verified)**: public `GET /health` and `GET /` → 200 for unauthenticated and every Prisma role. `GET /auth/me` → 401 unauthenticated / invalid Bearer; 200 for VIEWER, CREATOR, BRAND_ADMIN, SUPER_ADMIN. `GET /users` and `GET /users/:id` → 401 unauthenticated / invalid Bearer; 403 VIEWER, CREATOR, BRAND_ADMIN (org-scoped list still **NOT SPECIFIED**); 200 SUPER_ADMIN. Frontend aliases `ORGANIZATION_ADMIN` / `PLATFORM_ADMIN` are not JWT roles. M04–M12 routes are registered, including judging, leaderboard, super-admin, and the M12 rate limits.

### 3.2 Global Error Handler (`src/middleware/error.middleware.ts`)
- Intercepts uncaught exceptions and Zod validation errors.
- Maps errors to standardized HTTP status codes and the frozen error envelope (`{ success: false, message, data: null, errors }`) via `errorResponse`. There is **no** top-level `timestamp` on the envelope.

### 3.3 Standard Response Envelope (`src/utils/response.ts`) — frozen M01-P01-T01
- **`ApiResponse<T>`**: `{ success: boolean, message: string, data: T or null, errors: unknown or null }`.
- **`sendSuccess(reply, data, message?, statusCode?)`**: HTTP status default `200`; body `{ success: true, message, data, errors: null }`.
- **`sendError(reply, message?, statusCode?, errors?)`**: HTTP status default `400`; body `{ success: false, message, data: null, errors }`.
- **`sendPaginated`**: same success envelope; `data` is `{ items, pagination }`.
- Stricter `errors` item schema: **NOT SPECIFIED** (callers typically pass `null` or `{ field, message }[]`).

---

## 4. Endpoints & Layer Implementation Status

### 4.1 Implemented Endpoints (`cos-backend/src/routes/index.ts`)

Health and root contracts frozen by **M01-P01-T04** (see [api-map.md](file:///D:/woofskis/docs/knowledge/api-map.md) §1.1). Public; `sendSuccess` envelope. Health does not probe Prisma (DB readiness **NOT SPECIFIED**). Root `data.name` is `SYSTEM_CONSTANTS.APP_NAME` (`Contest Operating System Backend`).

| HTTP Method | Route Path | Schema Validation | Controller Handler | Implementation Status |
|---|---|---|---|---|
| `GET` | `/api/v1/health` | `healthSwaggerSchema` | Inline health handler | `IMPLEMENTED` |
| `GET` | `/api/v1/` | `rootSwaggerSchema` | Inline root info handler | `IMPLEMENTED` |
| `POST` | `/api/v1/auth/register/creator` | `registerCreatorSwaggerSchema` | `AuthController.registerCreator` (assigns deployment organization) | `IMPLEMENTED` |
| `POST` | `/api/v1/auth/register/brand` | — | Not registered. See [deployment-model.md](deployment-model.md). | `REMOVED` |
| `POST` | `/api/v1/auth/login` | `loginSwaggerSchema` | `AuthController.login` | `IMPLEMENTED` |
| `GET` | `/api/v1/auth/me` | `getMeSwaggerSchema` | `AuthController.getMe` (Auth Required) | `IMPLEMENTED` |
| `GET` | `/api/v1/users` | `listUsersSwaggerSchema` | `UserController.listUsers` (`authenticate` + `authorizeRoles(SUPER_ADMIN)`) | `IMPLEMENTED` |
| `GET` | `/api/v1/users/:id` | `getUserByIdSwaggerSchema` | `UserController.getUserById` (`authenticate` + `authorizeRoles(SUPER_ADMIN)`) | `IMPLEMENTED` |
| `GET` | `/api/v1/organizations/:slug/branding` | `getOrganizationBrandingSwaggerSchema` | `OrganizationController.getBrandingBySlug` (public, no `authenticate`) | `IMPLEMENTED` |
| `PUT` | `/api/v1/organizations/:id/branding` | `updateOrganizationBrandingSwaggerSchema` | `OrganizationController.updateBranding` (`authenticate` + `authorizeRoles(BRAND_ADMIN, SUPER_ADMIN)`; own-org check in `OrganizationService`) | `IMPLEMENTED` |
| `GET` | `/api/v1/contests` | `listContestsSwaggerSchema` | `ContestController.list` (`authenticate` + `authorizeRoles(BRAND_ADMIN, SUPER_ADMIN)`; tenant scope in `ContestService`) | `IMPLEMENTED` |
| `GET` | `/api/v1/contests/active` | `listDeploymentActiveContestsSwaggerSchema` | `ContestController.listDeploymentActive` (public; deployment organization only) | `IMPLEMENTED` |
| `POST` | `/api/v1/contests` | `createContestSwaggerSchema` | `ContestController.create` (same guards; creates `DRAFT`) | `IMPLEMENTED` |
| `POST` | `/api/v1/contests/banners/presign` | `presignContestBannerSwaggerSchema` | `ContestController.presignBanner` (ADMIN; private S3 PUT) | `IMPLEMENTED` |
| `GET` | `/api/v1/contests/:id` | `getContestSwaggerSchema` | `ContestController.getById` | `IMPLEMENTED` |
| `PATCH` | `/api/v1/contests/:id` | `updateContestSwaggerSchema` | `ContestController.update` (metadata and one-step status) | `IMPLEMENTED` |
| `POST` | `/api/v1/submissions/presign` | `presignSubmissionSwaggerSchema` | `SubmissionController.presign` (`authenticate` + `authorizeRoles(CREATOR)`) | `IMPLEMENTED` |
| `POST` | `/api/v1/submissions/complete` | `completeSubmissionSwaggerSchema` | `SubmissionController.complete` (same guards; persists `PENDING_REVIEW`) | `IMPLEMENTED` |
| `GET` | `/api/v1/submissions/me` | `listMySubmissionsSwaggerSchema` | `SubmissionController.listMine` | `IMPLEMENTED` |
| `GET` | `/api/v1/submissions/:id` | `getSubmissionSwaggerSchema` | `SubmissionController.getById` (owner only) | `IMPLEMENTED` |
| `GET` | `/api/v1/admin/moderation/queue` | `moderationQueueSwaggerSchema` | `ModerationController.queue` (`authenticate` + `authorizeRoles(BRAND_ADMIN, SUPER_ADMIN)`; tenant scope in `ModerationService`) | `IMPLEMENTED` |
| `POST` | `/api/v1/admin/submissions/:id/approve` | `approveSubmissionSwaggerSchema` | `ModerationController.approve` | `IMPLEMENTED` |
| `POST` | `/api/v1/admin/submissions/:id/reject` | `rejectSubmissionSwaggerSchema` | `ModerationController.reject` (required `reason`) | `IMPLEMENTED` |
| `GET` | `/api/v1/admin/moderation/audit-logs` | `auditLogsSwaggerSchema` | `ModerationController.auditLogs` | `IMPLEMENTED` |
| `GET` | `/api/v1/contests/:id/queue` | `judgingQueueSwaggerSchema` | `JudgingController.queue` (public) | `IMPLEMENTED` |
| `POST` | `/api/v1/contests/:id/videos/:videoId/rate` | `rateSubmissionSwaggerSchema` | `JudgingController.rate` (auth optional; VIEWER/anon) | `IMPLEMENTED` |
| `GET` | `/api/v1/contests/:id/leaderboard` | `getLeaderboardSwaggerSchema` | `LeaderboardController.getLeaderboard` (public) | `IMPLEMENTED` |
| `GET` | `/api/v1/submissions/:id/voters` | `listVotersSwaggerSchema` | `VoterController.list` (public, approved submission only) | `IMPLEMENTED` |
| `GET` | `/api/v1/super-admin/organizations` | `listSuperAdminOrganizationsSwaggerSchema` | `OrganizationController.listForSuperAdmin` (`authenticate` + `authorizeRoles(SUPER_ADMIN)`) | `IMPLEMENTED` |
| `POST` | `/api/v1/super-admin/organizations/:id/suspend` | `suspendOrganizationSwaggerSchema` | `OrganizationController.suspend` (`authenticate` + `authorizeRoles(SUPER_ADMIN)`) | `IMPLEMENTED` |
| `POST` | `/api/v1/super-admin/organizations/:id/reinstate` | `reinstateOrganizationSwaggerSchema` | `OrganizationController.reinstate` (`authenticate` + `authorizeRoles(SUPER_ADMIN)`) | `IMPLEMENTED` |

---

### 4.2 Implemented Backend Endpoints & Layers

| Feature Domain | Implemented Endpoints | Service / Repository | Status |
|---|---|---|---|
| **Contests** | `GET /api/v1/contests`, `POST /api/v1/contests`, `GET /api/v1/contests/:id`, `PATCH /api/v1/contests/:id` | `ContestService`, `ContestRepository`, `CategoryRepository` | `IMPLEMENTED` (M05) |
| **Judging & Ratings** | `GET /api/v1/contests/:id/queue`, `POST /api/v1/contests/:id/videos/:videoId/rate` | `JudgingService`, `RatingRepository` | `IMPLEMENTED` (M08) |
| **Creator Submissions** | `POST /api/v1/submissions/presign`, `POST /api/v1/submissions/complete`, `GET /api/v1/submissions/me`, `GET /api/v1/submissions/:id` | `SubmissionService`, `SubmissionRepository`, `StorageService` / `S3StorageAdapter` | `IMPLEMENTED` (M06). Legacy `/submissions/upload` is not registered. |
| **Moderation Queue** | `GET /api/v1/admin/moderation/queue`, `POST /api/v1/admin/submissions/:id/approve`, `POST /api/v1/admin/submissions/:id/reject`, `GET /api/v1/admin/moderation/audit-logs` | `ModerationService`, `AuditLogRepository`, `SubmissionRepository` | `IMPLEMENTED` (M07). No flag or bulk route. |
| **Leaderboards** | `GET /api/v1/contests/:id/leaderboard` | `LeaderboardService`, `SubmissionRepository` | `IMPLEMENTED` (M09) |
| **Tenant list (M10-P01-T01)** | `GET /api/v1/super-admin/organizations` | `OrganizationController.listForSuperAdmin` → `OrganizationService.listOrganizations` → `OrganizationRepository.findAll`. SUPER_ADMIN only | `IMPLEMENTED` |
| **Tenant suspension (M10-P01-T02/T03)** | `POST /api/v1/super-admin/organizations/:id/suspend`, `.../reinstate` | `OrganizationController.suspend`/`reinstate` → `OrganizationService.suspendOrganization`/`reinstateOrganization` → `OrganizationRepository.suspend`/`reinstate`. SUPER_ADMIN only. `ContestService` returns 409 on create/PATCH for a SUSPENDED organization | `IMPLEMENTED` |

---

## 5. Database Schema & Prisma State

Current `cos-backend/prisma/schema.prisma` models:
- **`model Organization`** (`IMPLEMENTED`): `id`, `name`, `slug`, `branding Json?`, `status OrganizationStatus` (`ACTIVE` | `SUSPENDED`), `suspendedAt DateTime?`, `suspensionReason String?`, `createdAt`, `updatedAt`, `users`, `categories`, `contests`. `OrganizationRepository` handles CRUD, branding replacement, and suspend/reinstate operations.
- **`model User`** (`IMPLEMENTED`): `id`, `email`, `passwordHash`, `name`, `role Role`, `organizationId String?`, `createdAt`, `updatedAt`. Domain-model `handle` / `avatarUrl` are **PLANNED**; persistence is **NOT SPECIFIED** (M02-P01-T05). No Prisma columns, no JWT claims, no sanitized API fields.
- **`enum Role`** (`IMPLEMENTED`): `SUPER_ADMIN`, `BRAND_ADMIN`, `CREATOR`, `VIEWER`.
- **`enum ContestStatus`**, **`model Category`**, **`model Contest`** (`IMPLEMENTED`, M05). Status values exclude cancellation. `Contest.submissions` added in M06.
- **`enum SubmissionStatus`**, **`model Submission`** (`IMPLEMENTED`, M06 + M07). Unique `objectKey`. Moderation columns `rejectionReason`, `moderatedById`, `moderatedAt`. Nullable `deletedAt` / `deletedById` are the creator soft delete. `ratings` relation added in M08. Score writes go through `RatingRepository`. Leaderboard results are derived directly from active `Submission` rows (M09).
- **`enum AuditAction`**, **`model AuditLog`** (`IMPLEMENTED`, M07). Append-only. Retention **NOT SPECIFIED**.
- **`model Rating`** (`IMPLEMENTED`, M08). Optional `userId` and `voterFingerprint`. Indexes are not unique.
- **Models still planned**: None for MVP. All 7 core models and 4 enums are fully active and migrated in the database.
- **`enum FriendshipStatus`**, **`model Friendship`**: One unordered creator pair (`userLowId`, `userHighId`), `requesterId`, `PENDING` | `ACCEPTED`. Migration `20261011180000_creator_friendships` is additive and must be applied before use. Routes live under `/api/v1/friends` and use `creatorGuards` (`authenticate`, `Role.CREATOR`, active account). Guests and `ADMIN` are not granted access. `FriendshipService` does not call contest, submission, judging, or leaderboard services.
- **`enum ChatAttachmentKind`**, **`model ChatMessage`**, **`model ChatRead`**: Messages and read cursors for an accepted friendship. Migration `20261011220000_creator_chat` is additive and must be applied before use. Routes live under `/api/v1/chat` and use the same `creatorGuards`. Real-time delivery is `GET /chat/stream` (server-sent events). No WebSocket package is installed. Fanout is in-memory for one API process. Attachments reuse the private S3 presign adapter. `ChatService` does not call contest, submission, judging, or leaderboard services.
