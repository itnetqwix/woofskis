# Woofskis Architecture Reference Specification

> **Target Platform**: Woofskis (`woofskis.com`)  
> **Platform**: Contest Operating System (Single-Product Architecture for Woofskis)  
> **Audit Type**: Read-Only Architectural Reference Audit  
> **Authoritative Files Consulted**: `/docs/knowledge/` (`architecture.md`, `deployment-model.md`, `data-model.md`, `backend-map.md`, `frontend-map.md`, `api-map.md`, `business-rules.md`, `ai-development-workflow.md`, `project-graph.md`), `/docs/graphify/cos-project-graph.json`, `/docs/graphify/graph-cli.js`, `/docs/graphify/graph-schema.json`, `/infra/cloudflare/media-worker/`, `backend/prisma/schema.prisma`, `backend/src/routes/index.ts`.  
> **Date**: October 2026  

---

## 1. System Architecture & Repository Structure

### 1.1 Deployment & Architecture Reality
- **Single-Product Paradigm**: Although early design documentation (`/docs/source/`, early implementation plans) described multi-tenant brand isolation via an `Organization` model, the active codebase transitioned on 2026-09-29 (migration `20260929140000_single_product_woofskis`) to a **single-product deployment**.
- **Tenancy Dropped**: The `organizations` table was dropped, role enums were simplified to `ADMIN` and `CREATOR`, and all contests, categories, submissions, and ratings operate globally within the deployment.
- **Replication Model for Woofskis**: Woofskis will **not** be an organization row inside woofskis; it must be an entirely **independent deployment** of the same single-product stack at `woofskis.com`.

### 1.2 Repository Structure
```
D:/woofskis/
├── frontend/   # Frontend: Next.js 14 App Router, TailwindCSS, Redux Toolkit, React Query
│   ├── src/
│   │   ├── app/                # Route handlers & page layouts: (auth), (dashboard), (viewer), page.tsx
│   │   ├── components/         # Shared UI, layout, common, and role guard primitives
│   │   ├── features/           # Domain feature slices: auth, contests, judging, leaderboard, submissions, admin, friends, chat
│   │   ├── lib/                # Axios client, query client, theme/initials utils
│   │   ├── services/           # Feature API clients matching backend contracts
│   │   ├── store/              # Redux slices (authSlice, uiSlice)
│   │   └── types/              # Central TypeScript domain interfaces
├── backend/                # Backend: Node.js (ESM), Fastify 5, Prisma ORM 6, TypeScript 5.9
│   ├── prisma/
│   │   ├── migrations/         # 15 PostgreSQL migration folders
│   │   └── schema.prisma       # Active schema definition (10 models, 6 enums)
│   ├── scripts/                # bootstrap-woofskis.ts (Admin provisioning)
│   └── src/
│       ├── config/             # env.ts (Zod env parser), constants.ts, database.ts
│       ├── controllers/        # Clean architecture HTTP controllers
│       ├── middleware/         # auth.middleware.ts, error.middleware.ts
│       ├── plugins/            # cors.ts, helmet.ts, jwt.ts, prisma.ts, swagger.ts, rate-limit.ts
│       ├── repositories/       # Prisma data access repositories
│       ├── routes/             # index.ts (/api/v1 Fastify route registrations)
│       ├── schemas/            # Fastify Swagger & Zod validation schemas
│       ├── services/           # Domain services, S3 storage adapter, consensus math, SSE chat
│       └── utils/              # Standard response envelope helpers (sendSuccess, sendError)
├── docs/
│   ├── graphify/               # Machine-readable graph database, schema, and CLI query tool
│   ├── knowledge/              # Structured, actionable architectural documentation
│   └── source/                 # 17 historical source chapters (foundational business rules)
└── infra/
    └── cloudflare/
        └── media-worker/       # Cloudflare Worker for private S3 origin proxy & streaming cache
```

---

## 2. Module-by-Module Implementation Map

### 2.1 Authentication & Roles
- **Role Model**: Strictly `ADMIN` (platform operators) and `CREATOR` (authenticated contestants). Unauthenticated visitors are `VIEWER`/guest.
- **JWT Claims**: `{ id, email, role }` (7-day expiration).
- **Backend Files**:
  - Routes: `backend/src/routes/index.ts` (`POST /auth/login`, `POST /auth/register/creator`, `GET /auth/me`)
  - Controller: `backend/src/controllers/auth.controller.ts`
  - Service: `backend/src/services/auth.service.ts`
  - Middleware: `backend/src/middleware/auth.middleware.ts` (`authenticate`, `authenticateOptional`, `authorizeRoles`, `requireActiveCreator`)
  - Schemas: `backend/src/schemas/auth.schema.ts`
  - Plugin & Security: `backend/src/plugins/jwt.ts`, `backend/src/plugins/rate-limit.ts` (10 req/15 min limit on auth endpoints)
  - Data Access: `backend/src/repositories/user.repository.ts`
- **Frontend Files**:
  - Pages: `frontend/src/app/(auth)/login/page.tsx`, `frontend/src/app/(auth)/register/page.tsx`
  - Components: `frontend/src/features/auth/components/login-form.tsx`, `frontend/src/features/auth/components/creator-register-form.tsx`
  - Session Hook: `frontend/src/features/auth/hooks/use-auth-session.ts`
  - Client API: `frontend/src/services/auth-api.ts`
  - Route Guard: `frontend/src/components/auth/role-guard.tsx`, `frontend/src/components/auth/role-guard-policy.ts`
  - Redux State: `frontend/src/store/slices/auth-slice.ts`

### 2.2 Creator Registration & Profiles
- **Profile Capabilities**: Registration requires `name`, `email`, `password`. Profile edits (`PATCH /auth/me`) update `name` and bio. Avatars upload via S3 presigned PUT (`POST /auth/me/avatar/presign`) storing `avatarObjectKey`. Profiles render short-lived signed GET URLs.
- **Backend Files**:
  - Controller: `backend/src/controllers/auth.controller.ts` (`registerCreator`, `updateMe`, `presignAvatar`)
  - Service: `backend/src/services/auth.service.ts`
  - Storage Logic: `backend/src/services/storage.service.ts` (`AVATAR_CONTENT_TYPES`, key `avatars/{creatorId}/{uuid}.{ext}`)
  - Schemas: `backend/src/schemas/auth.schema.ts`
- **Frontend Files**:
  - Profile Form: `frontend/src/features/auth/components/creator-profile-editor.tsx`
  - Shared Avatar UI: `frontend/src/components/common/profile-avatar.tsx`
  - Friend Profile Modal: `frontend/src/features/friends/components/friend-profile-modal.tsx`
  - Profile Hook: `frontend/src/features/friends/hooks/use-friend-profile.ts`
  - Client API: `frontend/src/services/auth-api.ts`, `frontend/src/services/friends-api.ts`

### 2.3 Admin Management
- **Capabilities**: Dedicated bootstrap script provisions the single admin. Admins inspect creators, review creator activity logs, issue warnings, set creator status (`ACTIVE` vs `BLOCKED`), view contest participants, and perform administrative hard deletion.
- **Backend Files**:
  - Bootstrap: `backend/scripts/bootstrap-woofskis.ts`
  - Controller: `backend/src/controllers/admin-creator.controller.ts`, `backend/src/controllers/user.controller.ts`
  - Service: `backend/src/services/admin-creator.service.ts`, `backend/src/services/user.service.ts`
  - Repositories:
    - `backend/src/repositories/admin-creator.repository.ts`
    - `backend/src/repositories/creator-warning.repository.ts`
    - `backend/src/repositories/creator-activity.repository.ts`
    - `backend/src/repositories/user.repository.ts`
  - Schemas: `backend/src/schemas/admin-creator.schema.ts`, `backend/src/schemas/user.schema.ts`
- **Frontend Files**:
  - Admin Pages: `frontend/src/app/(dashboard)/admin/creators/page.tsx`, `frontend/src/app/(dashboard)/admin/creators/[id]/page.tsx`
  - Components:
    - `frontend/src/features/admin/components/creator-directory.tsx`
    - `frontend/src/features/admin/components/creator-profile.tsx`
    - `frontend/src/features/admin/components/issue-warning-modal.tsx`
    - `frontend/src/features/admin/components/contest-participants.tsx`
    - `frontend/src/features/admin/components/admin-tabs-nav.tsx`
  - Client API: `frontend/src/services/admin-creators-api.ts`

### 2.4 Contest Creation, Banner Cropping, & Timezone Scheduling
- **Lifecycle & Constraints**: `DRAFT` → `SCHEDULED` → `ACTIVE` → `JUDGING` → `COMPLETED` → `ARCHIVED`. Once `ACTIVE`, settings are immutable. Contests support IANA timezone display (default `Asia/Kolkata`), submission window (`startDate` to `endDate`), and explicit `votingClosesAt`.
- **Banner Pipeline**: Admin uploads image via presigned S3 PUT (`POST /contests/banners/presign`), frontend crops to banner specifications, and contest stores `bannerObjectKey` (`contest-banners/{contestId}/{uuid}.{ext}`). Reads generate signed GET URLs.
- **Backend Files**:
  - Controller: `backend/src/controllers/contest.controller.ts`
  - Service: `backend/src/services/contest.service.ts`, `backend/src/services/contest-schedule.ts`, `backend/src/services/contest-lifecycle.ts`
  - Repositories: `backend/src/repositories/contest.repository.ts`, `backend/src/repositories/category.repository.ts`
  - Schemas: `backend/src/schemas/contest.schema.ts`
- **Frontend Files**:
  - Page: `frontend/src/app/(dashboard)/admin/contests/page.tsx`
  - Components:
    - `frontend/src/features/admin/components/contest-create-modal.tsx`
    - `frontend/src/features/admin/components/contests-management-table.tsx`
    - `frontend/src/features/admin/components/contest-lifecycle-card.tsx`
    - `frontend/src/features/contests/components/contest-banner-crop-modal.tsx`
    - `frontend/src/features/contests/components/contest-banner-thumbnail.tsx`
    - `frontend/src/features/contests/components/contest-presentation.tsx`
  - Utilities: `frontend/src/features/contests/lib/contest-banner.ts`, `frontend/src/features/contests/lib/contest-presentation.ts`, `frontend/src/features/contests/lib/contest-schedule.ts`
  - Client API: `frontend/src/services/contests-api.ts`

### 2.5 Video Uploads & Private S3 Storage
- **Direct S3 Upload**: Fastify never streams or buffers video bytes. Client calls `POST /submissions/presign`, receives a presigned S3 PUT URL (900s TTL), uploads directly to S3 with content length and type headers, then calls `POST /submissions/complete`.
- **Constraints**: MP4, WebM, MOV; ≤100MB; ≤60 seconds.
- **Storage Keys**: `contests/{contestId}/creators/{creatorId}/{uuid}.{ext}`. Private bucket with Block Public Access.
- **Edge Streaming Worker**: Cloudflare Worker proxies requests to `media.woofskis.com/v1/<objectKey>`, signs AWS S3 requests with `aws4fetch`, handles HTTP `Range` headers for seeking, and sets 1-year immutable caching.
- **Backend & Infra Files**:
  - Controller: `backend/src/controllers/submission.controller.ts`
  - Services: `backend/src/services/submission.service.ts`, `backend/src/services/storage.service.ts`, `backend/src/services/s3-storage.adapter.ts`
  - Repository: `backend/src/repositories/submission.repository.ts`
  - Cloudflare Worker: `infra/cloudflare/media-worker/src/index.js`, `infra/cloudflare/media-worker/wrangler.toml`
- **Frontend Files**:
  - Upload UI: `frontend/src/features/submissions/components/upload-modal.tsx`
  - Constraints Lib: `frontend/src/features/submissions/lib/video-constraints.ts`
  - Client API: `frontend/src/services/submissions-api.ts`

### 2.6 Submission Approval, Soft Deletion, & Moderation
- **Moderation Workflow**: Submissions enter `PENDING_REVIEW`. Admin review queue (`GET /admin/moderation/queue`) allows approve or reject (mandatory categorized reason). Decisions log to `audit_logs`.
- **Creator Soft Deletion**: Creator calls `DELETE /submissions/:id`, setting `deletedAt` and `deletedById`. Soft-deleted rows are hidden from queues and leaderboards, while keeping ratings and S3 objects. Admin hard delete remains available at `DELETE /admin/submissions/:id`.
- **Backend Files**:
  - Controllers: `backend/src/controllers/moderation.controller.ts`, `backend/src/controllers/submission.controller.ts` (`remove`)
  - Services: `backend/src/services/moderation.service.ts`, `backend/src/services/submission.service.ts`
  - Repositories: `backend/src/repositories/audit-log.repository.ts`, `backend/src/repositories/submission.repository.ts`
  - Schemas: `backend/src/schemas/moderation.schema.ts`, `backend/src/schemas/submission.schema.ts`
- **Frontend Files**:
  - Moderation Page: `frontend/src/app/(dashboard)/admin/moderation/page.tsx`
  - Components:
    - `frontend/src/features/admin/components/moderation-split-viewer.tsx`
    - `frontend/src/features/admin/components/moderation-table.tsx`
    - `frontend/src/features/admin/components/reject-reason-dialog.tsx`
    - `frontend/src/features/admin/components/moderation-audit-log-modal.tsx`
    - `frontend/src/features/admin/components/moderation-metrics.tsx`
    - `frontend/src/features/submissions/components/delete-submission-dialog.tsx`
    - `frontend/src/features/submissions/components/submissions-table.tsx`
    - `frontend/src/features/submissions/components/creator-metrics-cards.tsx`
  - Submissions Hook: `frontend/src/features/submissions/hooks/use-creator-submissions.ts`
  - Client APIs: `frontend/src/services/moderation-api.ts`, `frontend/src/services/submissions-api.ts`

### 2.7 Live Judging, 1–10 Ratings, & Leaderboard
- **Judging Flow**: Public continuous single-video loop (`GET /contests/:id/queue`). Ratings accept 1–10 (frontend UI displays 5 stars mapped to values).
- **Anti-Fraud / Uniqueness**: Ratings are guarded by `(submissionId, voterIpHash)` where `voterIpHash` is an HMAC-SHA256 of the client connection IP keyed with `JWT_SECRET`. Repeated ratings update the previous score without inflating total votes. Route rate limit enforces 60 req/min per IP.
- **Consensus Formula**: Running average formula with 1.8s auto-advance delay reveal:
  $$\text{NewScore} = \text{round}\left(\frac{\text{PreviousScore} \times \text{PreviousVotes} + \text{Rating}}{\text{PreviousVotes} + 1}, 1\right)$$
- **Leaderboard**: Public ranked list of `APPROVED` submissions ordered by `communityScore` desc, then `totalVotes` desc. Top 3 rendered in visual podium.
- **Backend Files**:
  - Controllers: `backend/src/controllers/judging.controller.ts`, `backend/src/controllers/leaderboard.controller.ts`, `backend/src/controllers/voter.controller.ts`, `backend/src/controllers/comment.controller.ts`
  - Services:
    - `backend/src/services/judging.service.ts`
    - `backend/src/services/community-score.ts`
    - `backend/src/services/voter-ip-hash.ts`
    - `backend/src/services/leaderboard.service.ts`
    - `backend/src/services/voter.service.ts`
    - `backend/src/services/comment.service.ts`
  - Repositories: `backend/src/repositories/rating.repository.ts`, `backend/src/repositories/submission.repository.ts`, `backend/src/repositories/comment.repository.ts`
  - Schemas: `backend/src/schemas/judging.schema.ts`, `backend/src/schemas/leaderboard.schema.ts`, `backend/src/schemas/comment.schema.ts`
- **Frontend Files**:
  - Judging Landing: `frontend/src/app/page.tsx`
  - Leaderboard Page: `frontend/src/app/(viewer)/leaderboard/page.tsx`
  - Judging Components:
    - `frontend/src/features/judging/components/viewer-container.tsx`
    - `frontend/src/features/judging/components/vertical-video-feed.tsx`
    - `frontend/src/features/judging/components/video-player.tsx`
    - `frontend/src/features/judging/components/video-slide.tsx`
    - `frontend/src/features/judging/components/rating-bar.tsx`
    - `frontend/src/features/judging/components/star-rating.tsx`
    - `frontend/src/features/judging/components/star-celebration.tsx`
    - `frontend/src/features/judging/components/score-reveal-overlay.tsx`
    - `frontend/src/features/judging/components/previous-rated-card.tsx`
    - `frontend/src/features/judging/components/comments-sheet.tsx`
    - `frontend/src/features/judging/components/queue-completed.tsx`
  - Leaderboard Components:
    - `frontend/src/features/leaderboard/components/leaderboard-podium.tsx`
    - `frontend/src/features/leaderboard/components/leaderboard-table.tsx`
    - `frontend/src/features/leaderboard/components/leaderboard-filters.tsx`
    - `frontend/src/features/leaderboard/components/leaderboard-video-modal.tsx`
    - `frontend/src/features/leaderboard/components/voters-sheet.tsx`
  - Hooks: `frontend/src/features/judging/hooks/use-contest-queue.ts`, `frontend/src/features/leaderboard/hooks/use-leaderboard.ts`
  - Client APIs: `frontend/src/services/judging-api.ts`, `frontend/src/services/leaderboard-api.ts`, `frontend/src/services/comments-api.ts`, `frontend/src/services/voters-api.ts`

### 2.8 Creator Friendships & Friend Requests
- **Data Model**: `Friendship` model stores unordered creator pairs with `userLowId < userHighId` and `requesterId`. States: `PENDING` | `ACCEPTED`.
- **Capabilities**: Name search (`GET /friends/search`), send request, accept, reject, cancel, and remove. Friend profile viewing displays creator stats and approved videos.
- **Backend Files**:
  - Controller: `backend/src/controllers/friendship.controller.ts`
  - Service: `backend/src/services/friendship.service.ts`
  - Repository: `backend/src/repositories/friendship.repository.ts`
  - Schemas: `backend/src/schemas/friendship.schema.ts`
- **Frontend Files**:
  - Page: `frontend/src/app/(dashboard)/creator/friends/page.tsx`
  - Components: `frontend/src/features/friends/components/friends-panel.tsx`, `frontend/src/features/friends/components/friend-profile-modal.tsx`
  - Hooks: `frontend/src/features/friends/hooks/use-creator-friends.ts`, `frontend/src/features/friends/hooks/use-friend-profile.ts`
  - Client API: `frontend/src/services/friends-api.ts`

### 2.9 One-to-One Chat, SSE Delivery, & Media Sharing
- **Real-Time Delivery**: Server-Sent Events via `GET /api/v1/chat/stream`. No WebSocket dependencies. Push events: `message` and `read`.
- **Media Attachments**: Presigned direct upload to S3 (`POST /chat/attachments/presign`) with key `chat/{friendshipId}/{senderId}/{uuid}.{ext}` (images: JPEG/PNG/WebP/GIF, videos: MP4/WebM/MOV up to 100MB). Presigned GET URLs provided on message retrieval.
- **Read Tracking**: `ChatRead` table stores `(friendshipId, userId, lastReadAt)` cursor to calculate unread counts dynamically.
- **Backend Files**:
  - Controller: `backend/src/controllers/chat.controller.ts`
  - Services: `backend/src/services/chat.service.ts`, `backend/src/services/chat-realtime.ts`
  - Repository: `backend/src/repositories/chat.repository.ts`
  - Schemas: `backend/src/schemas/chat.schema.ts`
- **Frontend Files**:
  - Conversation Page: `frontend/src/app/(dashboard)/creator/friends/[friendshipId]/page.tsx`
  - Components: `frontend/src/features/chat/components/creator-chat.tsx`
  - Hook & SSE Client: `frontend/src/features/chat/hooks/use-creator-chat.ts`, `frontend/src/features/chat/chat-stream.ts`
  - Client API: `frontend/src/services/chat-api.ts`

### 2.10 Frontend Shared Components, UI Tokens, & Client Architecture
- **Shared UI Primitives**: Radix UI wrappers (`@radix-ui/react-*`) in `frontend/src/components/ui/` (buttons, dialogs, dropdowns, inputs, sheets, tabs, badges).
- **Navigation & Layout**: `frontend/src/components/layout/` (top navbar, mobile bottom navigation bar, sidebars).
- **Network Client**:
  - Instance & Interceptors: `frontend/src/lib/axios.ts` (Attaches `Authorization: Bearer <token>` from localStorage `cos_auth_token`; on 401 dispatches `cos:unauthorized` and removes token).
  - Standard Client: `frontend/src/services/api-client.ts` (`http.*` returning typed `ApiResponse<T>`).
- **Responsive Theme Tokens**: TailwindCSS configuration in `tailwind.config.ts`, `globals.css` with dark glassmorphism aesthetic.

### 2.11 Database Schema & Migrations
- **Engine**: PostgreSQL (Neon / RDS).
- **Schema**: `backend/prisma/schema.prisma` defines 10 models:
  1. `User` (id, email, passwordHash, name, role, accountStatus, avatarObjectKey)
  2. `Category` (id, name, slug)
  3. `Contest` (id, categoryId, title, description, tagline, bannerObjectKey, status, timezone, startDate, endDate, votingClosesAt, prizeSummary, rules, autoAdvanceDelayMs)
  4. `Submission` (id, contestId, creatorId, title, description, videoUrl, objectKey, durationSeconds, status, rejectionReason, communityScore, totalVotes, deletedAt, deletedById)
  5. `AuditLog` (id, submissionId, actorId, action, reason, metadata)
  6. `Rating` (id, submissionId, userId, voterFingerprint, voterIpHash, rating)
  7. `Comment` (id, submissionId, authorId, body)
  8. `CreatorWarning` (id, creatorId, issuedById, reason)
  9. `CreatorActivityLog` (id, creatorId, action, description, metadata, performedByUserId)
  10. `Friendship` (id, userLowId, userHighId, requesterId, status)
  11. `ChatMessage` (id, friendshipId, senderId, body, attachmentKey, attachmentKind, attachmentMime, attachmentBytes)
  12. `ChatRead` (friendshipId, userId, lastReadAt)
- **Migrations History**: 15 migrations in `backend/prisma/migrations/`.

---

## 3. Required Independent Woofskis Resources

To operate Woofskis at `woofskis.com` without cross-contamination:

| Resource Category | Specification for Woofskis | Isolation & Configuration Details |
|---|---|---|
| **Git Repositories** | `woofskis` (or separate monorepo) | Independent codebase cloned from clean single-product snapshot. |
| **PostgreSQL Database** | Dedicated instance (Neon, Supabase, or AWS RDS) | New isolated database connection string (`DATABASE_URL`). Do NOT share tables or database with woofskis. |
| **Object Storage (S3)** | Dedicated bucket: `woofskis-production-media` | AWS Region (e.g., `us-east-2`). Private ACL, Block Public Access ON, CORS configured for web client presigned `PUT` requests. |
| **Media Delivery / CDN** | Cloudflare Worker: `woofskis-media` | Deployed with Worker secrets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and vars `S3_BUCKET = "woofskis-production-media"`, `AWS_REGION = "us-east-2"`. |
| **Domain & DNS** | `woofskis.com`, `api.woofskis.com`, `media.woofskis.com` | - Web frontend: `https://woofskis.com`<br/>- Backend REST API: `https://api.woofskis.com`<br/>- Media proxy CDN: `https://media.woofskis.com` |
| **Backend Environment** | `backend/.env` | `PORT=5000`<br/>`NODE_ENV=production`<br/>`DATABASE_URL=postgresql://...`<br/>`JWT_SECRET=<strong-random-secret-for-woofskis>`<br/>`LOG_LEVEL=info`<br/>`AWS_REGION=us-east-2`<br/>`AWS_S3_BUCKET=woofskis-production-media`<br/>`AWS_ACCESS_KEY_ID=...`<br/>`AWS_SECRET_ACCESS_KEY=...` |
| **Admin Bootstrap** | Script: `bootstrap-woofskis.ts` | `WOOFSKIS_ADMIN_EMAIL=admin@woofskis.com`<br/>`WOOFSKIS_ADMIN_PASSWORD=<secure-password>`<br/>`WOOFSKIS_ADMIN_NAME="Woofskis Admin"` |
| **Frontend Environment** | `frontend/.env.production` | `NEXT_PUBLIC_APP_NAME="Woofskis"`<br/>`NEXT_PUBLIC_APP_DESCRIPTION="The Premier Dog Video Competition Platform"`<br/>`NEXT_PUBLIC_APP_URL="https://woofskis.com"`<br/>`NEXT_PUBLIC_API_BASE_URL="https://api.woofskis.com/api/v1"`<br/>`NEXT_PUBLIC_API_TIMEOUT=15000`<br/>`NODE_ENV=production` |

---

## 4. Module Dependencies & Implementation Order

```
┌────────────────────────────────────────────────────────┐
│  Phase 1: Foundation Infrastructure                    │
│  (DB Instance, S3 Bucket, Cloudflare Worker, Envs)     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 2: Database Schema & Baseline Migration         │
│  (Clean schema.prisma, init migration, Admin Bootstrap)│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 3: Core Backend & Authentication Layer          │
│  (Fastify app, JWT, Rate Limiter, /auth/login & reg)   │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 4: S3 Storage & Media Streaming Pipeline        │
│  (StorageService, S3 adapter, Cloudflare media proxy)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 5: Contest Lifecycle & Scheduling Domain        │
│  (Categories, Contests CRUD, Timezones, Banner Presign)│
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 6: Video Submissions & Moderation Queue         │
│  (Presign/Complete video upload, Approve/Reject/Audit) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 7: Public Judging, 1-10 Ratings, & Leaderboard  │
│  (Queue delivery, IP-hash consensus, Leaderboard math) │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 8: Creator Friendships & Social Directory       │
│  (Friend requests, Creator search, Profile modals)     │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 9: Real-time 1-on-1 Chat & Media Sharing        │
│  (SSE /chat/stream, messages, read receipts, attachs)  │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│  Phase 10: Frontend Shell Rebranding & Integration     │
│  (Branding tokens, Dog/Woofskis assets, Verification)  │
└────────────────────────────────────────────────────────┘
```

### Detailed Order Rationale
1. **Infrastructure & Envs**: Backend cannot start without valid database and storage credentials.
2. **Database Clean Baseline**: Rather than running 15 legacy woofskis migrations (which create and drop `Organization`), generate a clean initial migration from `schema.prisma` (`prisma migrate diff` or clean baseline `init`). Run the Woofskis admin bootstrap.
3. **Core Auth**: Identity, bcrypt password hashing, JWT signing, and RBAC middleware are required by all subsequent endpoints.
4. **Storage Adapter**: Contests require banner upload, creators require avatar upload, and submissions require video upload. The S3 storage adapter must be in place.
5. **Contests**: Submissions cannot be created without active contests and categories.
6. **Submissions & Moderation**: Judging cannot occur without approved submissions.
7. **Judging & Leaderboards**: Core public experience consuming approved submissions.
8. **Friendships**: Chat requires accepted friendships as prerequisites.
9. **Chat**: SSE streaming, message persistence, and attachments hanging off friendships.
10. **Frontend Rebranding**: Replacing woofskis branding, logos, theme colors, and copy with Woofskis dog competition assets.

---

## 5. Graphify & Knowledge Maintenance Workflow

The project uses Graphify (`docs/graphify/`) to keep architectural dependencies machine-readable and avoid scanning the entire codebase.

### 5.1 Existing Graphify CLI Commands
All commands run via `node docs/graphify/graph-cli.js`:
- `node docs/graphify/graph-cli.js stats`: View total node/edge counts broken down by taxonomy and status.
- `node docs/graphify/graph-cli.js validate`: Validate JSON schema compliance, node IDs, source citations, and referential integrity of all edges.
- `node docs/graphify/graph-cli.js query --node <ID>`: Query details and incoming/outgoing edges for a specific node (e.g. `feat:continuous_queue`, `api:POST /auth/login`).
- `node docs/graphify/graph-cli.js trace-path --start <ID> --end <ID>`: Perform BFS path tracing across the full stack (e.g., from `role:creator` to `db:Submission`).
- `node docs/graphify/graph-cli.js list-by-type --type <Type>`: List all nodes of a specific taxonomy (e.g., `APIEndpoint`, `FrontendComponent`, `DatabaseModel`).
- `node docs/graphify/graph-cli.js export-mermaid`: Export complete graph structure to Mermaid flowchart syntax.

### 5.2 Minimum Workflow to Keep Knowledge & Graph Updated Without Rescanning
When developing or enhancing features for Woofskis:
1. **Targeted Query First**:
   - Run `node docs/graphify/graph-cli.js query --node <domain:X>` or `trace-path` to identify affected layers.
2. **Implement Feature Vertically**:
   - Modify only the required repository, service, route, and frontend component.
3. **Incremental Documentation Update**:
   - Update only the specific section in `/docs/knowledge/` (`api-map.md`, `data-model.md`, or `frontend-map.md`).
4. **Add/Update Nodes in `cos-project-graph.json`**:
   - Append the new node (with `id`, `type`, `label`, `domain`, `status: IMPLEMENTED`, `sourceReference`, `codeReference`) and connecting edges.
5. **Run Quick Validation**:
   - Execute `node docs/graphify/graph-cli.js validate`.
   - If the command outputs `[PASS] All nodes and edges are valid and consistent!`, the graph update is complete. No whole-codebase scan is needed.

---

## 6. Known Limitations & Undocumented Decisions (Do Not Guess)

The following items are explicit limitations or decisions in the active codebase that must **not** be guessed or modified without explicit instruction:

1. **In-Memory SSE Chat Fanout**:
   - `backend/src/services/chat-realtime.ts` maintains an in-memory `Map<string, Set<Sink>>` for SSE listeners.
   - *Limitation*: Real-time chat works only on a single API process. If Woofskis is deployed on multiple container instances/replicas, messages sent to instance A will not reach a recipient connected to instance B without adding Redis pub/sub.
2. **In-Memory Rate Limiting**:
   - `@fastify/rate-limit` runs with an in-memory store per route (`authCredentialRateLimit`, `ratingRateLimit`).
   - *Limitation*: Rate limits reset on server restart and do not coordinate across multiple cluster instances.
3. **IP Hash Voting Guard & Reverse Proxy / Cloudflare**:
   - `voter-ip-hash.ts` computes HMAC-SHA256 of `request.ip` keyed by `JWT_SECRET`.
   - *Limitation*: Behind Cloudflare or a reverse proxy, `request.ip` will be the proxy's IP unless Fastify `trustProxy` is configured. In woofskis, `trustProxy` is not enabled in backend.
4. **No Server-Side Video Transcoding Pipeline**:
   - The application relies on client-side format/duration validation (`MP4/WebM/MOV`, ≤100MB, ≤60s) before direct S3 upload.
   - *Limitation*: There is no server-side FFmpeg transcoding, thumbnail generation, or HLS segmentation pipeline.
5. **User `handle` Persistence is Absent**:
   - `handle` (e.g. `@woofcreator`) was dropped from the backend API contract and does not exist in Prisma `User`. Frontend creators are identified by `name` and `email`. Do not invent a `handle` column without an explicit task.
6. **Podium Prize Payouts & Monetization**:
   - Prize amounts shown on the leaderboard podium (`$5,000`, `$2,500`, `$1,000`) are client-side presentation constants. There is no automated payout, banking integration, or wallet table.
7. **Migration Baseline Recommendation for Woofskis**:
   - The existing 15 migrations contain historical mutations (creating, altering, and dropping `organizations` and `OrganizationStatus`).
   - For Woofskis, creating a single clean baseline migration `init` from `backend/prisma/schema.prisma` is strongly recommended over replaying all 15 historical woofskis migrations.
8. **Chat Message & Friendship Limits**:
   - Message body cap of 2,000 characters and name search limit of 20 results are engineering defaults, not source business rules.
