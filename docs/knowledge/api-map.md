# API Map & Endpoint Contract Specification

> **Canonical Path**: `/docs/knowledge/api-map.md`  
> **Backend Repository**: [backend](file:///D:/woofskis/backend/)  
> **Base URL**: `http://localhost:5000/api/v1` (`PORT` defaults to `5000` in `backend/src/config/env.ts`; see M01-P01-T02). Frontend `.env.example` `NEXT_PUBLIC_API_BASE_URL` is aligned to this URL (M01-P02-T01). Local FE app: `http://localhost:3000` (M01-P02-T05; `frontend/README.md`).  
> **OpenAPI Documentation**: `http://localhost:5000/docs` (spec JSON: `http://localhost:5000/docs/json`)  
> **Last Updated**: 2026-09-22

---

## Standard Response Envelope

Frozen by **M01-P01-T01** in `backend/src/utils/response.ts` (`sendSuccess` / `sendError`).

Every JSON API body uses exactly four top-level fields:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "errors": null
}
```

| Field | Success (`sendSuccess`) | Error (`sendError`) |
|---|---|---|
| `success` | `true` | `false` |
| `message` | Human-readable status string | Human-readable error string |
| `data` | Payload (`T`; caller may pass `null`) | always `null` |
| `errors` | always `null` | `null` or details (`unknown`; often `{ field, message }[]`) |

HTTP status is **not** inside the body. `sendSuccess` defaults to `200`; `sendError` defaults to `400`. Callers pass `201` / `401` / `403` / `404` / `409` as needed.

**Not in this envelope:** top-level `timestamp` (NOT SPECIFIED at envelope level; health may put `timestamp` inside `data`); nested `{ error: { code, message } }`; top-level `meta` (pagination is `data.pagination`). Endpoint examples below may omit `errors: null` for brevity; the live helpers always include the field.

Frontend `ApiResponse` is aligned **M01-P02-T03** in `frontend/src/types/api.ts` and `src/services/api-client.ts` (`http.*` returns `Promise<ApiResponse<T>>`). Prototype `timestamp` / nested `error` / top-level `meta` were removed from that type. Detailed `errors` item schema remains **NOT SPECIFIED**.

---

## 1. Implemented Endpoints

The following endpoints are fully implemented and functional in `backend/src/routes/index.ts`:

### 1.1 System & Health

Frozen by **M01-P01-T04** in `backend/src/routes/index.ts` (prefix `SYSTEM_CONSTANTS.API_PREFIX` = `/api/v1`). Both routes are public (no `authenticate`). Both use `sendSuccess` (M01-P01-T01 envelope, including `errors: null`).

Health does **not** probe Prisma / `DATABASE_URL`. Database readiness on this endpoint is **NOT SPECIFIED** in `/docs/source` or `/docs/knowledge`; the handler returns a static `healthy` payload plus a live ISO timestamp.

Root `data.name` is `SYSTEM_CONSTANTS.APP_NAME` (`Contest Operating System Backend`), **not** the npm package name `cos-backend`. `data.version` is `SYSTEM_CONSTANTS.API_VERSION` (`1.0.0`).

`GET /api/v1/` and `GET /api/v1` (trailing-slash variants) are both accepted by Fastify for the root route.

#### `GET /api/v1/health`
- **Auth**: Public
- **Description**: Verifies service operational readiness (liveness payload; no DB probe).
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Contest Operating System API is healthy",
  "data": {
    "status": "healthy",
    "timestamp": "2026-09-22T12:00:00.000Z"
  },
  "errors": null
}
```
`data.timestamp` is produced by `new Date().toISOString()` (dynamic).

#### `GET /api/v1/`
- **Auth**: Public
- **Description**: Returns API root version information.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Hello World from Contest Operating System API!",
  "data": {
    "version": "1.0.0",
    "name": "Contest Operating System Backend"
  },
  "errors": null
}
```

---

### 1.2 Authentication (`/api/v1/auth`)

JWT access-token claims issued by `AuthService` and verified by `fastify.authenticate` are exactly `{ id, email, role, organizationId }` (M02-P01). Refresh-token claims and extra profile claims (`handle`, `avatarUrl`) are **NOT SPECIFIED**.

`User.handle` and `User.avatarUrl` are domain-model **PLANNED** fields. They are **not** persisted in Prisma and are **not** returned on auth responses (M02-P01-T05). See [data-model.md](file:///D:/woofskis/docs/knowledge/data-model.md) §1.1.

**M02-P01-T06 — `handle` dropped from API contract:** Frontend `CreatorRegisterPayload.username` (required in the prototype form) is **not** sent to or stored by `POST /auth/register/creator`. Adding a Prisma `handle` column was rejected because uniqueness, `@` prefix, and required-vs-nullable rules are **NOT SPECIFIED** in `/docs/source`. Extra JSON keys (including `handle`) are stripped by Zod and ignored; they are not an error.

**M02-P02 frontend mapping:** `src/features/auth/lib/auth-payloads.ts` maps creator `fullName` → `name` and brand `adminName`/`businessEmail`/subdomain-label → `name`/`email`/`slug`. It does **not** POST `handle` / `username` / `avatarUrl` / `category` / `bio` / `agreeToTerms` / `rememberMe`. Live calls go through `src/services/auth-api.ts`.

Password min length 6 is the existing Zod constraint (engineering default already implemented). Source password policy, email verification, and password reset remain **NOT SPECIFIED** / **PLANNED**.

**M12 rate limits (engineering defaults, not business rules).** `POST /auth/login` and `POST /auth/register/creator` each allow 10 requests per 15 minutes per connection IP. The counters are separate. `POST /auth/register/brand` is not registered (single-organization deployment; see [deployment-model.md](deployment-model.md)). `GET /auth/me` is not limited. The 11th request on a limited route returns **429** with the frozen envelope `{ success: false, message: "Too many requests", data: null, errors: null }`. `X-Forwarded-For` is not trusted. A blocked request does not reach bcrypt. `passwordHash` is removed by `sanitizeUser` before login and register responses are sent.

**M12-P01-T03 JWT review.** Expiry remains `7d` (`SYSTEM_CONSTANTS.JWT_EXPIRES_IN`). Claims remain `{ id, email, role, organizationId }`. The signing secret remains `env.JWT_SECRET`. Minimum length, rotation, and failing boot when the secret is unset stay **NOT SPECIFIED** (the M01 fallback remains).

#### `POST /api/v1/auth/register/creator`
- **Auth**: Public
- **Description**: Registers a new content creator account (`role: CREATOR`), bcrypt-hashes the password, and returns a JWT.
- **Request Body** (required: `email`, `password`, `name` — **no `handle`**):
```json
{
  "email": "creator@example.com",
  "password": "SecurePassword123!",
  "name": "Jane Doe"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Creator account created successfully",
  "data": {
    "user": {
      "id": "uuid-v4",
      "email": "creator@example.com",
      "name": "Jane Doe",
      "role": "CREATOR",
      "organizationId": "deployment-organization-uuid",
      "createdAt": "2026-09-22T12:00:00.000Z"
    },
    "token": "jwt-bearer-token"
  },
  "errors": null
}
```
- **Error `409 Conflict`**: `{ "success": false, "message": "User with this email already exists", "data": null, "errors": null }`
- **Error `404 Not Found`**: deployment organization is not provisioned.
- **Assignment**: `organizationId` is the organization for `DEPLOYMENT_ORGANIZATION_SLUG`. The body does not include an organization, brand, or domain.

#### `POST /api/v1/auth/register/brand`

**Removed from the product (2026-09-29).** Not registered. A deployment does not create organizations from the client. See [deployment-model.md](deployment-model.md). The historical contract below is not the live route.

#### Historical contract (not registered)
- **Auth**: Public
- **Description**: Atomically registers an Organization and a `BRAND_ADMIN` user in one Prisma transaction, then returns a JWT whose `organizationId` is the new org.
- **Request Body** (required: `email`, `password`, `name`, `organizationName`, `slug` — **not** `organizationSlug`):
```json
{
  "email": "admin@brand.com",
  "password": "SecurePassword123!",
  "name": "Brand Admin",
  "organizationName": "Acme Brand",
  "slug": "acme-brand"
}
```
- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Brand organization and admin created successfully",
  "data": {
    "user": {
      "id": "uuid-v4",
      "email": "admin@brand.com",
      "name": "Brand Admin",
      "role": "BRAND_ADMIN",
      "organizationId": "org-uuid-v4",
      "createdAt": "2026-09-22T12:00:00.000Z"
    },
    "organization": {
      "id": "org-uuid-v4",
      "name": "Acme Brand",
      "slug": "acme-brand"
    },
    "token": "jwt-bearer-token"
  },
  "errors": null
}
```
- **Error `409 Conflict`**: duplicate email (`User with this email already exists`) or duplicate slug (`Organization with this slug already exists`).

#### `POST /api/v1/auth/login`
- **Auth**: Public
- **Description**: Authenticates existing user (bcrypt compare) and returns a sanitized user plus JWT. Unknown email and wrong password both return `401` with `Invalid email or password`.
- **Request Body**:
```json
{
  "email": "creator@example.com",
  "password": "SecurePassword123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-v4",
      "email": "creator@example.com",
      "name": "Jane Doe",
      "role": "CREATOR",
      "organizationId": null
    },
    "token": "jwt-bearer-token"
  },
  "errors": null
}
```

#### `GET /api/v1/auth/me`
- **Auth**: `Bearer JWT` (Any authenticated user; `fastify.authenticate`)
- **Description**: Returns current authenticated user profile loaded by JWT `id`. `passwordHash` is never selected.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "id": "uuid-v4",
    "email": "creator@example.com",
    "name": "Jane Doe",
    "role": "CREATOR",
    "organizationId": null,
    "createdAt": "2026-09-22T12:00:00.000Z"
  },
  "errors": null
}
```
- **Error `401`**: missing/invalid Bearer token. **Error `404`**: `User profile not found`.

---

### 1.3 User Management (`/api/v1/users`)

Frozen by **M03-P01-T02**. Both routes require `fastify.authenticate` then `authorizeRoles(Role.SUPER_ADMIN)`. Unauthenticated → **401**. Authenticated non-`SUPER_ADMIN` (including `BRAND_ADMIN`, `CREATOR`, `VIEWER`) → **403**. Self-profile remains `GET /auth/me` (any authenticated role).

**BRAND_ADMIN organization-scoped user list:** **NOT SPECIFIED** in `/docs/source` and knowledge. M03-P01 does **not** allow it and does **not** invent tenant-filtered listing (org scoping belongs to later modules). `GET /users*` is platform-admin only.

**M03-P03 verified API matrix** (M03 routes only. M04 organization branding is implemented separately and is not part of this frozen M03 table):

| API | Unauthenticated | VIEWER | CREATOR | BRAND_ADMIN | SUPER_ADMIN |
|---|---|---|---|---|---|
| `GET /api/v1/health` | 200 | 200 | 200 | 200 | 200 |
| `GET /api/v1/` | 200 | 200 | 200 | 200 | 200 |
| `GET /api/v1/auth/me` | 401 | 200 | 200 | 200 | 200 |
| `GET /api/v1/users` | 401 | 403 | 403 | 403 | 200 |
| `GET /api/v1/users/:id` | 401 | 403 | 403 | 403 | 200 |

#### `GET /api/v1/users`
- **Auth**: `Bearer JWT` + role `SUPER_ADMIN`
- **Description**: Lists registered users (paginated). Not available to `BRAND_ADMIN`.
- **Response `200 OK`**: Paginated envelope via `sendPaginated` (`data.items`, `data.pagination`). Example:
```json
{
  "success": true,
  "message": "Users list retrieved successfully",
  "data": {
    "items": [
      {
        "id": "uuid-v4",
        "email": "user@example.com",
        "name": "User Name",
        "role": "CREATOR",
        "organizationId": null
      }
    ],
    "pagination": {
      "totalCount": 1,
      "totalPages": 1,
      "currentPage": 1,
      "limit": 20,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "errors": null
}
```
- **Error `401`**: missing/invalid Bearer. **Error `403`**: authenticated but not `SUPER_ADMIN`.

#### `GET /api/v1/users/:id`
- **Auth**: `Bearer JWT` + role `SUPER_ADMIN`
- **Description**: Fetches a single user by ID. Not a self-profile endpoint (`GET /auth/me`).
- **Response `200 OK`**: Returns user profile object.

---

### 1.4 Organization branding (`/api/v1/organizations`) — M04

The public organization view is `id`, `name`, `slug`, `branding`, `status`, `createdAt`, `updatedAt`. M10 added `status` (`ACTIVE` \| `SUSPENDED`) so the suspension overlay can read tenant state. `suspendedAt` and `suspensionReason` are returned only by the SUPER_ADMIN routes (section 2.6).

#### `GET /api/v1/organizations/:slug/branding`
- **Auth**: **Public.** No `authenticate` hook. A Bearer token is ignored because `jwtVerify` is not called. Theme tokens are viewer-facing (Ch 13.13). This GET has no role; PUT lists roles.
- **Description**: Returns `{ id, name, slug, branding, status, createdAt, updatedAt }`. Does not include users or the suspension reason. Unknown slug → **404**. `branding: null` is **200** (column is optional). GET does not re-validate historical JSON.
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Organization branding retrieved successfully",
  "data": {
    "id": "uuid",
    "name": "Woofskis",
    "slug": "woofskis",
    "branding": {
      "primaryColor": "#FF5722",
      "logoUrl": "https://woofskis.com/logo.png"
    }
  },
  "errors": null
}
```

#### `PUT /api/v1/organizations/:id/branding`
- **Auth**: `Bearer JWT` + `authorizeRoles(BRAND_ADMIN, SUPER_ADMIN)`.
- **Ownership**: `BRAND_ADMIN` may replace branding only when JWT `organizationId` equals `:id`. Any other organization → **403** (`own organization`) without a lookup. `SUPER_ADMIN` may update any existing organization. Missing organization after an authorized actor → **404**. `CREATOR` / `VIEWER` → **403**. Missing/invalid token → **401**.
- **Body**: data-model branding JSON. Required: `primaryColor` (hex), `logoUrl` (URI). Optional: `secondaryColor`, `accentColor`, `backgroundColor`, `fontFamily`, `bannerUrl`, `tagline`. Unknown keys rejected. PUT replaces the JSON document; it does not merge.
- **Not accepted**: slug changes, name changes, suspension, deletion. Slug mutability and organization deletion are **NOT SPECIFIED** for this route.
- **Response `200 OK`**: same organization view as GET, with the stored branding document.

---

### 1.5 Contests (`/api/v1/contests`) — M05

`ContestStatus` is `DRAFT`, `SCHEDULED`, `ACTIVE`, `JUDGING`, `COMPLETED`, `ARCHIVED`. Create always stores `DRAFT`. The only writes that change status are one-step patches: DRAFT→SCHEDULED→ACTIVE→JUDGING→COMPLETED→ARCHIVED. No skip, reverse, reopen, pause, or automatic date transition.

`CANCELLED` is not persisted. Master plan: cancellation triggers are **NOT SPECIFIED**. Suspension is also **NOT SPECIFIED** as a status.

There is no evaluation-criteria column and no prize-distribution column. `rules` is JSON (string or string array). `prizeSummary` is an optional string. `autoAdvanceDelayMs` defaults to `1800`. `categoryId` is optional. A contest has one category. Multiple categories per contest are **NOT SPECIFIED**.

**Auth for every contest route:** `Bearer JWT` + `authorizeRoles(BRAND_ADMIN, SUPER_ADMIN)`.

CREATOR and VIEWER contest reads are **NOT SPECIFIED**. These routes do not grant them. Unauthenticated requests are **401**.

**Tenant scope:** `BRAND_ADMIN` may create, list, get, and patch only contests whose `organizationId` equals JWT `organizationId`. A different `organizationId` or `tenantId` is **403** (`own organization`) . `SUPER_ADMIN` may use any existing organization. A missing organization on create is **404**. A missing contest is **404**. A contest that exists in another organization is **403** for `BRAND_ADMIN`.

#### `GET /api/v1/contests`
- **Query:** `tenantId` (organization UUID), `status`, `category` (category slug). All optional.
- **BRAND_ADMIN:** results are forced to the JWT organization. `tenantId` must match that id or be omitted.
- **SUPER_ADMIN:** `tenantId` filters one organization. Omitted `tenantId` returns every contest.
- **Response `200 OK`:** `data` is an array of contest views (`id`, `organizationId`, `organization` `{ id, name, slug }`, `categoryId`, `category`, `title`, `description`, `status`, `startDate`, `endDate`, `prizeSummary`, `rules`, `autoAdvanceDelayMs`, `createdAt`, `updatedAt`).

#### `POST /api/v1/contests`
- **Body (strict):** `organizationId`, `title`, `description`, `startDate`, `endDate` required. Optional: `categoryId` or `category` `{ name, slug?, description? }` (not both), `prizeSummary`, `rules`, `autoAdvanceDelayMs`.
- **Also accepted:** `tagline`, `bannerUrl`, `bannerObjectKey`, `thumbnailUrl`, `timezone` (IANA, default `Asia/Kolkata`), `votingClosesAt`.
- **Not accepted:** `status` (always DRAFT), criteria, prize breakdown.
- Submission deadline (`endDate`) must be after submission opening (`startDate`). When `votingClosesAt` is sent, it must be after `endDate`. Equal instants are **400**. Messages: "Submission deadline must be after submission opening." and "Voting closure must be after the submission deadline."
- `POST /api/v1/contests/banners/presign` (ADMIN) returns a private PUT URL. The image is not sent through Fastify. The contest stores `bannerObjectKey`, not the expiring URL.
- **Response `201 Created`:** the contest view.

#### `GET /api/v1/contests/:id`
- **Response `200 OK`:** one contest view. Unknown id → **404**.

#### `PATCH /api/v1/contests/:id`
- **Body (strict):** any subset of `title`, `description`, `startDate`, `endDate`, `prizeSummary`, `rules`, `autoAdvanceDelayMs`, `status`, `categoryId`, `category`. At least one field. Unknown keys, including `criteria`, are **400**.
- **DRAFT and SCHEDULED:** metadata and the next status may change together.
- **ACTIVE and JUDGING (BR-CONT-04):** settings, category, and rules are **409**. The next status step is still allowed.
- **Suspended organization (M10):** any PATCH (and any create) is **409** until the organization is reinstated.
- **COMPLETED (BR-CONT-05):** metadata is **409**. `status: ARCHIVED` is allowed.
- **ARCHIVED:** metadata and any further status are **409**.
- **Response `200 OK`:** the updated contest view.

Submission, queue, rating, and leaderboard routes are not part of M05.

---

## 2. Implemented endpoints (M06–M10)

These routes are registered. They are not a future contract. Section 2.1 contests are specified in section 1.5. Legacy `POST /submissions/upload` is not registered.

### 2.1 Contests
Implemented in section 1.5 (M05). Judging queue and rating routes are implemented in section 2.2 (M08).

### 2.2 Judging & Rating (`/api/v1/contests/:id/...`) — implemented M08

- **`GET /api/v1/contests/:id/queue`** (public): `APPROVED` submissions only, `createdAt` then `id` ascending. That order is display order, not a leaderboard rank. Contest must be `ACTIVE`, `JUDGING`, `COMPLETED`, or `ARCHIVED`. `DRAFT` and `SCHEDULED` return **409**. Unknown contest → **404**. Empty approved list → **200** with `items: []`. `data` is `{ contestId, status, ratingOpen, autoAdvanceDelayMs, items }`. `ratingOpen` is true only for `ACTIVE` and `JUDGING`. Items include creator `{ id, name }`, `communityScore`, `totalVotes`, and `viewerRating` (`null` or integer 1–10 for this request's hashed IP). Items do not include `objectKey` or `passwordHash`.
- **`POST /api/v1/contests/:id/videos/:videoId/rate`**: Body `{ rating, voterFingerprint? }`. `rating` is an integer 1–10. Historical 1–5 rows remain valid and are not rewritten. Auth is optional. No token → anonymous (`userId` null). `ADMIN` and `CREATOR` → **403**. Invalid Bearer → **401**. Optional `voterFingerprint` is stored as sent and is not the vote key. One current rating is stored per submission and HMAC of `request.ip`. A later rating updates that row. Vote count does not increase. The same identifier may rate another video. A simultaneous first insert that loses the unique index is **409**. Contest must be `ACTIVE` or `JUDGING`. `COMPLETED` and `ARCHIVED` reject new ratings and keep existing rows. Submission must be `APPROVED` and belong to that contest. Success **200** `data`: `{ previousScore, newScore, delta, totalVotes, ratingId, viewerRating }`. `newScore` and `delta` are rounded to 1 decimal using the running formula in `business-rules.md`. An update uses the replacement formula in that same section. **M12-P01-T02:** 60 requests per minute per connection IP, then **429** `Too many requests`.
- **`GET /api/v1/creator/contests`** and **`GET /api/v1/creator/contests/:id`** (Auth: `CREATOR`): every contest in this deployment, including `DRAFT`. Response includes `tagline`, `bannerUrl`, `thumbnailUrl`, and `prizeSummary`.
- **`GET /api/v1/contests/viewable`** (public): `ACTIVE`, `JUDGING`, `COMPLETED`, and `ARCHIVED`.
- **`DELETE /api/v1/contests/:id`** (Auth: `ADMIN`): Only `DRAFT` contests can be deleted. Once a contest becomes `ACTIVE`, it must never be deletable, including in `JUDGING` or `COMPLETED` states (returns **409** Conflict). Deleting a draft contest marks `deletedAt` without deleting associated submissions or media. Users and other contests are not deleted.

### 2.3 Creator Submissions (`/api/v1/submissions`) — implemented M06

> **Amendment:** Knowledge originally listed `POST /submissions/upload`. MVP uses **presign + complete**. Fastify never receives video bytes.

- **`POST /api/v1/submissions/presign`** (Auth: `CREATOR`): Body `{ contestId, contentType, fileSizeBytes, durationSeconds }`. Contest must exist and be `ACTIVE`. `contentType` is `video/mp4`, `video/webm`, or `video/quicktime`. Max `100 * 1024 * 1024` bytes. `durationSeconds` is client-reported, integer 1–60 (no media-processing pipeline). Returns `{ uploadUrl, objectKey, headers, expiresInSeconds, method: "PUT" }`. Backend constructs `objectKey` as `org/{organizationId}/contests/{contestId}/creators/{creatorId}/{uuid}.{ext}`. **M12-P01-T04:** the signer uses `PutObjectCommand` with Bucket, Key, and ContentType only (no ACL / `public-read`). AWS keys stay on the server. Presign TTL is 900 seconds (engineering default). The client uploads with HTTP PUT. Bucket CORS for the browser PUT and Block Public Access stay outside this repo. `videoUrl` stored at complete time remains an unsigned virtual-hosted reference and is not a playback credential. Queue, leaderboard, moderation, and submission responses replace `videoUrl` with a presigned GET for that row's `objectKey` (TTL 900 seconds, the same engineering default as upload presign). Signed URLs are not stored. `GetObject` does not set an ACL or a Range header; the browser sends Range to S3. There is no route that signs a client-supplied key. `getPublicUrl` does not change object ACL.
- **`POST /api/v1/submissions/complete`** (Auth: `CREATOR`): After the client PUT to S3. Body `{ contestId, objectKey, title, description?, durationSeconds, tags?, thumbnailUrl? }`. Persists `PENDING_REVIEW`. `objectKey` must be the backend-issued key for this creator and contest. Retry of the same key by the owner is idempotent (200). Client cannot set `status` or `videoUrl`.
- **Thumbnails:** presign also returns `thumbnail` (a presigned `image/jpeg` PUT for `contests/{contestId}/creators/{creatorId}/{uuid}.jpg`, same uuid as the video; `null` for legacy keys). The browser captures a frame about 25% into the clip, PUTs it, and sends that key as `thumbnailUrl` on complete. A thumbnail key that is not the one paired with `objectKey` is **400**. Capture or PUT failure sends `thumbnailUrl: null` and does not block the upload. Responses resolve stored keys with `resolveThumbnailUrl`: public audiences (queue, leaderboard, share preview) get `${MEDIA_CDN_BASE_URL}/v1/<key>` when configured, others get a short-lived signed GET. Videos without a thumbnail return `null`.
- **`GET /api/v1/submissions/me`** (Auth: `CREATOR`): The authenticated creator's active submissions only. Soft-deleted rows are omitted.
- **`GET /api/v1/submissions/:id`** (Auth: `CREATOR`): Own active submission only. Other creators and soft-deleted rows → 404. Admin reads are the creator-management APIs.
- **`DELETE /api/v1/submissions/:id`** (Auth: `CREATOR`): Soft-deletes one submission owned by the JWT user. Sets `deletedAt` and `deletedById`. Repeating the delete returns 200 and keeps the original `deletedAt`. Another creator's id is 404. `ADMIN` on this route is 403. Missing token is 401. The submission row, ratings, and S3 object are kept. Admin hard delete remains `DELETE /admin/submissions/:id`, which requires a JSON body `{ "reason": string }` (1–1000 chars) and notifies the creator.

BRAND_ADMIN, VIEWER, and SUPER_ADMIN are 403 on these routes. The creator JWT `organizationId` is the deployment organization. Presign and complete require that id to equal the contest `organizationId`. A mismatch is 403, returns no upload URL, and creates no submission. Max submissions per creator per contest: **NOT SPECIFIED**. Extra date-window checks beyond status `ACTIVE`: **NOT SPECIFIED**. Public discovery of this deployment's active contests is `GET /contests/active`.

Legacy **`POST /api/v1/submissions/upload`** is not registered.

Production presign targets private S3 (`woofskis-production-media`, `us-east-2`). Fastify does not receive video bytes. `GET /api/v1/demo/bootstrap` is not registered. Contest discovery is `GET /api/v1/contests/active` for `DEPLOYMENT_ORGANIZATION_SLUG`.

### 2.4 Admin Moderation (`/api/v1/admin`) — implemented M07

Auth on all four routes: `BRAND_ADMIN` or `SUPER_ADMIN`. `CREATOR` and `VIEWER` receive 403. Missing token receives 401.

`BRAND_ADMIN` is limited to submissions whose contest `organizationId` matches the JWT. A cross-tenant decision returns 403. `SUPER_ADMIN` is cross-tenant. A missing submission returns 404.

- **`GET /api/v1/admin/moderation/queue`**: Submissions in `PENDING_REVIEW` only, oldest first. This order is display order, not a moderation SLA (SLA is **NOT SPECIFIED**).
- **`POST /api/v1/admin/submissions/:id/approve`**: Body `{}` or optional `{ note }`. `PENDING_REVIEW` → `APPROVED`. Writes `moderatedById`, `moderatedAt`, and an `AuditLog` row with action `APPROVE`. `note` is stored as `reason` when present. Any other submission status, or a `COMPLETED`/`ARCHIVED` contest, returns 409.
- **`POST /api/v1/admin/submissions/:id/reject`**: Body `{ reason, reasonCode? }`. `reason` is required and trimmed; empty or missing reason returns 400 (BR-VID-02). `PENDING_REVIEW` → `REJECTED`. `rejectionReason` stores the reason text. Optional `reasonCode` is copied into audit `metadata` and is not a closed category list.
- **`GET /api/v1/admin/moderation/audit-logs`**: Append-only decision history, newest first, tenant-scoped the same way as the queue.

`ModerationService.flag` sets `FLAGGED` and writes `AuditAction.FLAG`. No flag, unflag, or bulk HTTP route is registered. `ISSUE_WARNING` and `SUSPEND_CREATOR` exist on the enum and are not written by M07.

### 2.5 Leaderboard (`/api/v1/contests/:id/leaderboard`) — implemented M09

- **`GET /api/v1/contests/:id/leaderboard`** (public): Returns ranked list of `APPROVED` submissions ordered strictly by `communityScore` descending, then `totalVotes` descending (BR-WIN-01).
- **Exclusions (BR-WIN-02)**: `REJECTED`, `PENDING_REVIEW`, `FLAGGED`, and soft-deleted submissions are excluded from the leaderboard. Their stored scores and rating rows are left in place. Submissions from other contests are excluded.
- **Closed Contests (BR-WIN-03)**: `COMPLETED` and `ARCHIVED` contests return official, immutable, read-only rankings.
- **Filters**: Optional `category` query param filters submissions matching category slug, category name, or tags. Optional `timeframe` query param is accepted; historical time-window ranking and timeframe trend calculations remain **NOT SPECIFIED** in source documentation.
- **Unknown Contest**: Returns **404** `Contest not found`.
- **Invalid UUID**: Returns **400** with validation errors.
- **Empty Leaderboard**: Returns **200** with `totalEntries: 0`, `totalVotes: 0`, `averageScore: 0`, `items: []`, and `podium: []`.
- **Response Shape**: Frozen envelope `{ success: true, message: "Leaderboard retrieved successfully", data: { contest, totalEntries, totalParticipants, totalVotes, averageScore, items, podium }, errors: null }`. `totalParticipants` is the count of distinct creators in that ranked set. `podium` contains the top 3 items. `creator` is `{ id, name, avatarUrl }`. `avatarUrl` is a short-lived presigned GET or null. Internal fields (`objectKey`, `passwordHash`, `moderatedById`) are never leaked. The route does not accept `page` or `limit`; it returns every eligible entry. The admin and public screens page that complete list in the browser.
- **Active contest selector**: the admin and public screens load `GET /api/v1/contests/active` and keep only `ACTIVE` contests. They do not fall back to another contest when none are active. Search filters the loaded rows and does not recompute rank.

### 2.5.1 Video categories

Official video categories reuse `Category` (the contest category catalog). There is no second category model. `isActive` was not previously stored; it was added so an administrator can retire a category without deleting contests or submissions. Default is `true`.

Deletion policy was **NOT SPECIFIED**. `DELETE` is refused with **409** when any submission or contest still references the category. Those rows are kept. Deactivate instead. Unused categories can be deleted. The database also uses `ON DELETE RESTRICT` from `submissions.categoryId`.

Case-insensitive name uniqueness is enforced in the service and by SQL index `categories_name_lower_key`.

- **`GET /api/v1/video-categories`** (authenticated): active categories only, name order. Inactive categories are omitted. `Other` is not a row.
- **`GET /api/v1/admin/video-categories`** (ADMIN): `{ items, pagination }`. Query `search`, `status` (`active` | `inactive` | `all`), `page`, `limit`. Each item includes `submissionCount` and `contestCount`.
- **`POST /api/v1/admin/video-categories`** (ADMIN): `{ name, description?, isActive? }`. Duplicate name → **409**.
- **`PATCH /api/v1/admin/video-categories/:id`** (ADMIN): any subset of `name`, `description`, `isActive`. At least one field.
- **`DELETE /api/v1/admin/video-categories/:id`** (ADMIN): unused only.

`POST /api/v1/submissions/complete` requires exactly one of `categoryId` (an active category) or `otherCategoryLabel` (trimmed, 1–80). Both or neither → **400**. Other stores `categoryId: null` and `otherCategoryLabel`, and does not create a `Category` row. An inactive or unknown `categoryId` → **400**. A retry of the same `objectKey` returns the original row and does not change the stored category. Submissions created before this field stay null; the UI may still show the contest category or first tag as display-only.
- **`GET /api/v1/submissions/:id/share-preview`** (public): Link preview metadata for one shared video. The submission must be `APPROVED`, not deleted, and in a viewable contest (`ACTIVE`, `JUDGING`, `COMPLETED`, `ARCHIVED`), otherwise **404**. `data` is `{ id, title, description, thumbnailUrl, creatorName }`. `thumbnailUrl` goes through `resolveThumbnailUrl` with the public audience (stored http(s) URL as-is, captured thumbnail key → stable `MEDIA_CDN_BASE_URL` URL, otherwise a short-lived signed GET or `null`). The frontend root page (`/?v=<id>`) uses it in `generateMetadata` to server-render Open Graph and Twitter tags. The tag image is the stable same-origin route `/media/submissions/:id/thumbnail`, which redirects to a public thumbnail, proxies an expiring download without putting that URL in the HTML, or falls back to the site logo. Private video objects and object keys are not published.
- **`GET /api/v1/submissions/:id/voters`** (public): Ratings for that submission only, newest first. The submission must be `APPROVED` or the route returns **404**. `data` is `{ items, pagination }` using the shared page/limit helper. Each item is `{ id, name, avatarUrl, rating, createdAt }`. Guests have `name: null`. Email, IP hash, and fingerprint are not returned. `communityScore` on the leaderboard remains the stored 1–10 average.

### 2.6 Super-admin organization administration — implemented M10

Branding GET/PUT are implemented (section 1.4).

All three routes: `Bearer JWT` + `authorizeRoles(SUPER_ADMIN)`. `BRAND_ADMIN` (including its own organization), `CREATOR`, and `VIEWER` → **403**. Missing/invalid token → **401**. Admin view: `{ id, name, slug, branding, status, suspendedAt, suspensionReason, createdAt, updatedAt }`. No users or credentials. No AuditLog row is written (not required by the M10 plan).

- **`GET /api/v1/super-admin/organizations`** (M10-P01-T01): every organization, newest first (display order only). Any query key → **400**. Pagination, search, filter, and sort are **NOT SPECIFIED**. Empty table → **200** with `data: []`. Message: `Organizations retrieved successfully`.
- **`POST /api/v1/super-admin/organizations/:id/suspend`** (M10-P01-T02): body `{ reason }`, required, trimmed, non-empty free text (no taxonomy; max length **NOT SPECIFIED**). Sets `status: SUSPENDED`, `suspendedAt` = now, `suspensionReason`. Invalid UUID or blank reason → **400**. Unknown organization → **404**. Already suspended → **409** (original reason and time kept). Message: `Organization suspended successfully`.
- **`POST /api/v1/super-admin/organizations/:id/reinstate`** (M10-P01-T03): no body (`{}` accepted; any field → **400**). Sets `status: ACTIVE`, clears `suspendedAt` and `suspensionReason`. Unknown organization → **404**. Not suspended → **409**. Message: `Organization reinstated successfully`.

**Effect of suspension (M10-P03-T02):** `POST /contests` and `PATCH /contests/:id` for a SUSPENDED organization → **409** `Organization is suspended: contest changes are blocked until it is reinstated`, for every actor including SUPER_ADMIN. Contest reads, submissions, moderation, ratings, leaderboard, and login are not blocked (not specified).

### 2.7 Creator friends (`/api/v1/friends`)

CREATOR only, and the creator account must be ACTIVE. Missing token → **401**. `ADMIN` → **403**. These routes do not read or write contests, submissions, ratings, or leaderboards. Email addresses are not returned. Chat and media sharing are not part of this phase.

- **`GET /api/v1/friends`**: `{ friends, incoming, outgoing }`. Each item is `{ id, status, direction, createdAt, user: { id, name, avatarUrl? } }`.
- **`GET /api/v1/friends/search?q=`**: Active creators whose name contains `q`, excluding the caller, up to 20. Empty `q` returns `[]`. Each item adds `relationship` (`NONE`, `INCOMING`, `OUTGOING`, `FRIENDS`) and `friendshipId`.
- **`POST /api/v1/friends/requests`**: Body `{ addresseeId }`. Self → **400**. Unknown, non-creator, or blocked target → **404**. Pending duplicate or already friends → **409**.
- **`POST /api/v1/friends/requests/:id/accept`**: Recipient only. **403** if the sender tries. **409** if the row is not pending.
- **`POST /api/v1/friends/requests/:id/reject`**: Recipient only. Deletes the row.
- **`DELETE /api/v1/friends/requests/:id`**: Sender cancels a pending request. Deletes the row.
- **`DELETE /api/v1/friends/:id`**: Either friend removes an accepted friendship. **409** if the row is still pending.

A caller who is not part of the friendship receives **404**. After reject, cancel, or remove, either creator may send a new request. A product rule for blocking a later request is **NOT SPECIFIED**.

### 2.8 Creator chat (`/api/v1/chat`)

CREATOR only, and the creator account must be ACTIVE. Missing token → **401**. `ADMIN` → **403**. These routes do not read or write contests, submissions, ratings, or leaderboards. Only an accepted friendship can be opened. A caller who is not one of the two friends receives **404**. A pending friendship receives **403**.

Real-time transport is server-sent events (`GET /api/v1/chat/stream`). No WebSocket dependency was added. Events are `message` and `read`. The stream is per process.

Attachment uploads are presigned PUTs to the existing private bucket. The API returns `uploadUrl`, `objectKey`, and headers. It does not return AWS credentials and does not set a public ACL. Message responses include a presigned GET `attachment.url` and do not include the storage key.

- **`GET /api/v1/chat/conversations`**: Accepted friends with `peer`, `unreadCount`, and `lastMessage` (`preview`, `createdAt`).
- **`GET /api/v1/chat/conversations/:id/messages`**: History, oldest-first in the page. Query `before` (exclusive ISO timestamp) and `limit` (default 40, max 100). `nextBefore` is set when older messages exist.
- **`POST /api/v1/chat/conversations/:id/messages`**: `{ body?, attachment? }`. Text may include emoji. At least one of trimmed body or attachment is required. Body max 2000 characters (engineering default). **201**.
- **`POST /api/v1/chat/conversations/:id/read`**: Sets `lastReadAt` to now. **200** `{ lastReadAt }`.
- **`POST /api/v1/chat/attachments/presign`**: `{ friendshipId, contentType, fileSizeBytes }`. Images: JPEG, PNG, WebP, GIF. Videos: MP4, WebM, MOV. Size must be 1 through 104857600 bytes. The signed PUT includes that content length.
- **`GET /api/v1/chat/stream`**: `text/event-stream` for the authenticated creator.

### 2.9 Notifications (`/api/v1/notifications`)

Any authenticated user (`ADMIN` or `CREATOR`). Missing token → **401**. Each caller sees only their own rows.

Rows are created by the backend, not through this API. A newly completed upload (`POST /submissions/complete` with `created: true`) notifies every `ADMIN` (`SUBMISSION_PENDING_REVIEW`). Approval notifies the submission's creator (`SUBMISSION_APPROVED`). Admin deletion (`DELETE /admin/submissions/:id`) notifies the creator (`SUBMISSION_DELETED`) with the admin's reason in `body`. The unique key `(userId, type, submissionId)` skips repeats. A failed notification write is logged and does not undo the upload or decision. Reject or flag notifications, email delivery, and retention are **NOT SPECIFIED**.

- **`GET /api/v1/notifications`**: `{ items, unreadCount }`. Newest first, at most 30 items. Each item has `id`, `type`, `title`, `body`, `submissionId`, `readAt`, `createdAt`.
- **`POST /api/v1/notifications/:id/read`**: Marks one notification read. Already read is a no-op. Another user's id → **404**.
- **`POST /api/v1/notifications/read-all`**: Marks all of the caller's notifications read.
