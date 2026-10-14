# Architecture & Technical System Design

> **Canonical Path**: `/docs/knowledge/architecture.md`  
> **Source Documents**: [Ch 4 Proposed Solution](file:///D:/woofskis/docs/source/4%20Proposed%20Solution%20390ca8c5bdf780a0b489efeb96dafd91.md), [Ch 7 Project Scope](file:///D:/woofskis/docs/source/7%20Project%20Scope%20390ca8c5bdf780cfa0b0ed54178fc27e.md), [Ch 11 Key Features & Capabilities](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md), [Ch 13 Assumptions & Constraints](file:///D:/woofskis/docs/source/13%20Assumptions%20&%20Constraints%20395ca8c5bdf78075bee7f07e22404768.md)  
> **Code Repositories**: [frontend](file:///D:/woofskis/frontend/), [backend](file:///D:/woofskis/backend/)  
> **Last Updated**: 2026-09-22

---

## 1. High-Level System Architecture

The Contest Operating System is structured as a decoupled, multi-tenant web application composed of a modern React/Next.js frontend and a high-performance Fastify backend running on Node.js/TypeScript with Prisma ORM and PostgreSQL.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Client Web Tier                               │
│              (frontend / Next.js 14)                                    │
│                                                                         │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────────────┐  │
│  │ (viewer) Route │  │ (dashboard) Route│  │  (auth) Route           │  │
│  │  Judging Queue │  │  Admin / Creator │  │  Login / Register forms │  │
│  │  & Leaderboard │  │  & Super-Admin   │  │  (Creator & Brand)      │  │
│  └───────┬────────┘  └────────┬─────────┘  └────────────┬────────────┘  │
│          │                    │                         │               │
│          └────────────────────┼─────────────────────────┘               │
│                               ▼                                         │
│                    State & Ingest Services                              │
│              (Redux Toolkit / React Query / Axios)                      │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │ HTTP / REST (JWT Bearer Token)
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          API Gateway & App Tier                         │
│                           (backend / Fastify 5)                         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Plugins: CORS, Helmet, Fastify-JWT, Swagger/OpenAPI, Prisma Client│  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│  ┌─────────────────────────────────▼─────────────────────────────────┐  │
│  │ Middleware: auth.middleware (RBAC), error.middleware              │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│  ┌─────────────────────────────────▼─────────────────────────────────┐  │
│  │ Routes & Schemas: /api/v1/auth, /api/v1/users (Zod Validation)    │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│  ┌─────────────────────────────────▼─────────────────────────────────┐  │
│  │ Services Layer: AuthService, UserService                          │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│  ┌─────────────────────────────────▼─────────────────────────────────┐  │
│  │ Repositories Layer: UserRepository (Clean Arch / Data Access)     │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           Data & Storage Tier                           │
│  ┌──────────────────────────────────┐  ┌─────────────────────────────┐  │
│  │ PostgreSQL Database (Neon)       │  │ AWS S3 (presigned PUT)      │  │
│  │ Organizations, Users, Contests,  │  │ Video bytes never enter     │  │
│  │ Submissions (M06)                │  │ Fastify                     │  │
│  └──────────────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Multi-Tenancy & Brand Scoping Model

The platform is designed around a multi-tenant hierarchy *(Source: [Ch 4.5](file:///D:/woofskis/docs/source/4%20Proposed%20Solution%20390ca8c5bdf780a0b489efeb96dafd91.md), [Ch 11.8](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md), [Ch 13.13](file:///D:/woofskis/docs/source/13%20Assumptions%20&%20Constraints%20395ca8c5bdf78075bee7f07e22404768.md))*:

### Architectural Scoping Rules
1. **Platform Foundation (Global & Shared)**:
   - Core authentication, user registry, voting calculation algorithms, security, and moderation workflows are centrally enforced and shared across all tenants.
2. **Organization / Brand Partitioning**:
   - Every tenant is an `Organization` record with a unique `slug`, `name`, and JSON-based `branding` metadata.
   - Users with role `BRAND_ADMIN` manage contests and content scoped to their `organizationId`.
   - Users with role `SUPER_ADMIN` have cross-tenant operational visibility.
3. **Frontend Dynamic Theming (`useTenantTheme`)**:
   - `frontend/src/features/admin/hooks/use-tenant-theme.ts` applies CSS custom property overrides (primary colors, background gradients, font tokens, and logo URLs) scoped to the active tenant.

---

## 3. Frontend Architecture (`frontend`)

### 3.1 Technology Stack
- **Framework**: Next.js 14.2.15 (App Router, React 18, TypeScript 5.6)
- **Styling**: TailwindCSS 3.4 + Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot`) + Lucide Icons
- **State Management**: Redux Toolkit 2.2 (`authSlice`, `uiSlice`) + TanStack React Query 5.59 (server state caching)
- **Form Handling & Validation**: Formik 2.4 + Yup 1.7 / Zod 3.23
- **Network Client**: Axios 1.7 (`src/lib/axios.ts`) with `baseURL = process.env.NEXT_PUBLIC_API_BASE_URL` (no fallback). Local FE app: `http://localhost:3000` (`next dev` default / Docker **3000**). Local API template (M01-P02-T01): `http://localhost:5000/api/v1`. FE→BE ports documented in `frontend/README.md` (M01-P02-T05). Request interceptor (frozen M01-P02-T02) attaches `Authorization: Bearer` from localStorage `cos_auth_token` (`STORAGE_KEYS.AUTH_TOKEN`) on the client only. Cookie transport: **NOT SPECIFIED**. Response interceptor (frozen M01-P02-T04) on HTTP 401 in the browser clears `cos_auth_token` and emits `cos:unauthorized` (no refresh-token / no interceptor redirect). `useAuthSession` (M02-P02-T05) listens and clears Redux/`AUTH_USER` in place. RoleGuard (M03-P02) then redirects unauthenticated users away from protected dashboards. No Next.js rewrite/proxy (`next.config.mjs`). Production/hosted API URL: **NOT SPECIFIED**. Auth HTTP helpers live in `src/services/auth-api.ts` (M02-P02).

### 3.2 Directory Structure & Module Boundaries
```
frontend/src/
├── app/
│   ├── (auth)/login, register/             # Creator & Brand authentication pages
│   ├── (dashboard)/admin/                  # Moderation, Contests, Brand theme controls
│   ├── (dashboard)/creator/                # Creator submission dashboard & metrics
│   ├── (dashboard)/super-admin/            # Global platform tenant provisioning
│   ├── (viewer)/leaderboard/               # Public community leaderboard
│   ├── page.tsx                            # Root continuous voting queue (ViewerContainer)
│   ├── layout.tsx & providers.tsx          # Redux + QueryClient + Theme providers
├── features/
│   ├── admin/                              # Split viewer, contest modal, theme form
│   ├── auth/                               # Login, CreatorRegister, BrandRegister; live API via useAuthSession
│   ├── judging/                            # VideoPlayer, RatingBar, ScoreReveal, hotkeys
│   ├── leaderboard/                        # Podium, leaderboard table, filters
│   ├── submissions/                        # Creator upload modal, submission table
├── store/                                  # Redux Toolkit root reducer & slices
├── services/                               # api-client.ts (Axios HTTP client)
├── types/                                  # Centralized TypeScript domain interfaces
└── constants/                              # Mock data & metadata fallback dictionaries
```

### 3.3 State & Ingestion Flow in Frontend
- **Judging Flow (`useContestQueue`)**: Ingests submissions &rarr; manages video index &rarr; handles hotkeys (1–10 ratings) &rarr; computes dynamic score consensus &rarr; shows 1.8s score reveal &rarr; auto-advances queue.
- **Current Data Strategy**: Uses client-side LocalStorage state (`cos_creator_submissions_v1`, `cos_viewer_muted_preference`) with fallback to initial mock constants for offline resilience during frontend prototyping. Ready to connect to backend REST APIs.

---

## 4. Backend Architecture (`backend`)

### 4.1 Technology Stack
- **Runtime & Framework**: Node.js (ESM), Fastify 5.12, TypeScript 5.9
- **Database & ORM**: PostgreSQL (hosted on Neon), Prisma ORM 6.4
- **Authentication**: `@fastify/jwt` 10.2 (JWT Bearer tokens; access-token claims `{ id, email, role, organizationId }`), `bcrypt` 6.0 (salt rounds = 10). `handle` / `avatarUrl` are not JWT claims (M02-P01-T05/T06).
- **Validation**: Zod 4.6 (Runtime request/response validation schemas)
- **Documentation**: `@fastify/swagger` 9.8 + `@fastify/swagger-ui` 6.1 (OpenAPI 3.0 at `/docs`)
- **Security & Headers**: `@fastify/cors` 11.3, `@fastify/helmet` 13.1, `@fastify/rate-limit` (M12, route-scoped, in-memory)

### 4.2 Layered Architectural Pattern
The backend strictly adheres to Clean Architecture and Repository Pattern:

```
[ HTTP Request ]
       │
       ▼
[ Fastify Route & Zod Schema Validation ]   <-- src/routes/, src/schemas/
       │
       ▼
[ Controller ]                              <-- src/controllers/
       │
       ▼
[ Service (Business Logic) ]                <-- src/services/
       │
       ▼
[ Repository (Data Access via Prisma) ]     <-- src/repositories/
       │
       ▼
[ PostgreSQL Database ]                     <-- Prisma Client
```

### 4.3 Directory Structure
```
backend/src/
├── config/           # env.ts: PORT, DATABASE_URL, JWT_SECRET, NODE_ENV, LOG_LEVEL, plus optional M06 AWS keys. CORS_ORIGIN is not an env key.
├── controllers/      # auth, user, organization, contest, submission, moderation, judging, leaderboard
├── middleware/       # auth.middleware.ts (JWT verify & role guard), error.middleware.ts
├── plugins/          # cors.ts, helmet.ts, jwt.ts, prisma.ts, swagger.ts (order frozen in app.ts M01-P01-T03). rate-limit.ts is registered inside the /api/v1 route plugin.
├── repositories/     # user, organization, category, contest, submission, audit-log, rating
├── routes/           # index.ts (Fastify route plugins)
├── schemas/          # auth, user, organization, contest, submission, moderation, judging, leaderboard (Zod + Swagger)
├── services/         # auth, user, organization, contest, submission, moderation, judging, leaderboard, StorageService / S3StorageAdapter
├── types/            # Fastify module augmentation & DTO interfaces
├── utils/            # Frozen ApiResponse envelope: sendSuccess / sendError ({ success, message, data, errors })
├── app.ts            # Frozen plugin order: cors → helmet → prisma → jwt → swagger → /api/v1 routes
└── server.ts         # Server bootstrapper & graceful shutdown handling
```

---

## 5. Architectural Implementation Status Breakdown

| Layer / Component | Implementation Status | Current Location / Details | Planned Next Steps |
|---|---|---|---|
| **Auth & RBAC (Backend)** | `IMPLEMENTED` | `backend/src/controllers/auth.controller.ts` (JWT, bcrypt, creator & brand register, login, me) | Add email verification tokens & password reset endpoints. |
| **Auth Forms (Frontend)** | `IMPLEMENTED` | `frontend/src/features/auth` — forms + `useAuthSession` call live `/api/v1/auth/*` via `src/services/auth-api.ts` (M02-P02). JWT in `STORAGE_KEYS.AUTH_TOKEN`; session hydrates from `GET /auth/me`. M02-P03 live FE verification passed. M03-P02 `RoleGuard` reads Redux session aliases (`ORGANIZATION_ADMIN` / `PLATFORM_ADMIN`) and guards `/creator`, `/admin/*`, `/super-admin`. M03-P03 verified the role×route matrix. | Email verification / password reset remain PLANNED. |
| **User Management (Backend)** | `IMPLEMENTED` | `backend/src/controllers/user.controller.ts` (List users, Get user by ID) | Add pagination, user status updates, profile edits. |
| **Judging Queue (Frontend)** | `IMPLEMENTED` | `useContestQueue` loads `GET /contests/:id/queue` and posts ratings. Reveal uses the server score and `autoAdvanceDelayMs`. | Public contest discovery is NOT SPECIFIED. Leaderboard remains M09. |
| **Judging / Rating (Backend)**| `IMPLEMENTED` | `Rating`, `JudgingService`, public queue, optional-auth rate. Voting window is ACTIVE and JUDGING. | Duplicate-vote window and fingerprint algorithm remain NOT SPECIFIED. |
| **Creator Submissions (Frontend)**| `IMPLEMENTED` | Upload modal presign → S3 PUT → complete. `useCreatorSubmissions` reads `GET /submissions/me`, including `rejectionReason` when present. | |
| **Submissions & Video Ingest (Backend)**| `IMPLEMENTED` | `Submission` model; `StorageService` / `S3StorageAdapter`; `POST /submissions/presign` + `POST /submissions/complete`. Moderation columns are written only by M07. Production storage is private S3 `woofskis-production-media` in `us-east-2`. There is no local-demo provider and no disk fallback. | Do not add multipart ingest. |
| **Moderation Queue (Frontend)**| `IMPLEMENTED` | `useModerationQueue` loads `GET /admin/moderation/queue` and audit logs. Approve and reject call the M07 APIs. `INITIAL_ADMIN_SUBMISSIONS` is not the queue source. | Flag, unflag, and bulk controls remain visible and do not persist (no documented route). |
| **Moderation & Admin (Backend)**| `IMPLEMENTED` | `AuditLog`, `ModerationService`, queue / approve / reject / audit-logs. `BRAND_ADMIN` organization scope; `SUPER_ADMIN` cross-tenant. | Flag HTTP route, escalation, warning, and suspension are not part of M07. |
| **Leaderboard (Frontend)**| `IMPLEMENTED` | `useLeaderboard` loads `GET /contests/:id/leaderboard`. Podium prize amounts are presentation constants. | Public contest discovery and timeframe math remain NOT SPECIFIED. |
| **Leaderboard (Backend)**| `IMPLEMENTED` | `LeaderboardService` ranks APPROVED submissions by `communityScore` desc, then `totalVotes` desc. No separate leaderboard table and no cache layer. | Timeframe aggregation remains NOT SPECIFIED. |
| **Multi-Tenancy (Backend DB)**| `IMPLEMENTED` (branding) | `Organization` plus `OrganizationRepository` / `OrganizationService`. Public GET branding by slug; PUT branding for `BRAND_ADMIN` own org or `SUPER_ADMIN`. M10: SUPER_ADMIN tenant list, suspend, reinstate; `status` column. | Suspension effects beyond contest writes are not specified. |
| **Multi-Tenancy (Frontend)**| `IMPLEMENTED` | `useTenantTheme` fetches branding by active slug. `brand-theme-form` PUT saves tokens. Optional `cos_org_branding_cache_v1`. Suspension overlay reads API `status` (M10). | Compliance notices remain a local prototype. |
