# Feature Map & Capability Inventory

> **Canonical Path**: `/docs/knowledge/feature-map.md`  
> **Source Documents**: [Ch 7 Project Scope](file:///D:/woofskis/docs/source/7%20Project%20Scope%20390ca8c5bdf780cfa0b0ed54178fc27e.md), [Ch 11 Key Features & Capabilities](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md), [Ch 16 Product Roadmap & Future Evolution](file:///D:/woofskis/docs/source/16%20Product%20Roadmap%20&%20Future%20Evolution%20395ca8c5bdf78063901dde129509e8e0.md)  
> **Code Repositories**: [content-operating-system](file:///D:/woofskis/content-operating-system/), [cos-backend](file:///D:/woofskis/cos-backend/)  
> **Last Updated**: 2026-09-22

---

## 1. Feature Matrix by User Persona

### 1.1 Visitor / Voter Experience (Community Engagement)

| Feature | Description | Source Ref | Frontend Implementation | Backend Implementation | Overall Status |
|---|---|---|---|---|---|
| **Continuous Video Queue** | Auto-loading vertical video player showing one candidate contest video at a time without infinite scroll feeds. | [Ch 6.2](file:///D:/woofskis/docs/source/6%20Product%20Vision%20390ca8c5bdf780e9810ac7d28a2ae7fd.md), [Ch 11.5](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `content-operating-system/src/features/judging/components/viewer-container.tsx` (`IMPLEMENTED`, loads `GET /contests/:id/queue`) | `IMPLEMENTED` (`GET /api/v1/contests/:id/queue`) | `IMPLEMENTED` |
| **Interactive Rating Bar** | Five stars above the video submit integers 1–5 through the existing rate API. Keys `1`-`5` submit that score. A later rating from the same viewer updates the existing row. The API still accepts 1–10. | [Ch 4.2](file:///D:/woofskis/docs/source/4%20Proposed%20Solution%20390ca8c5bdf780a0b489efeb96dafd91.md), [Ch 11.5](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `content-operating-system/src/features/judging/components/rating-bar.tsx` (`IMPLEMENTED`) | `IMPLEMENTED` (`POST /api/v1/contests/:id/videos/:videoId/rate`) | `IMPLEMENTED` |
| **Score Reveal Overlay** | Consensus score reveal for `Contest.autoAdvanceDelayMs` (default 1800) displaying previous score, delta, new community score, and animated countdown bar. | [Ch 6.3](file:///D:/woofskis/docs/source/6%20Product%20Vision%20390ca8c5bdf780e9810ac7d28a2ae7fd.md), [Ch 10.7](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md) | `content-operating-system/src/features/judging/components/score-reveal-overlay.tsx` (`IMPLEMENTED`, uses server `newScore` / `delta`) | `IMPLEMENTED` (rate response is the score source) | `IMPLEMENTED` |
| **Keyboard Hotkeys** | Hotkey support: `1-5` (rate), `Space` (play/pause), `M` (mute), `Right Arrow / N` (next), `Left Arrow / P` (prev), `R` (restart). | [Ch 6.3](file:///D:/woofskis/docs/source/6%20Product%20Vision%20390ca8c5bdf780e9810ac7d28a2ae7fd.md) | `content-operating-system/src/features/judging/hooks/use-contest-queue.ts` (`IMPLEMENTED`) | N/A (Client-only interaction) | `IMPLEMENTED` |
| **Public Leaderboard** | Real-time ranked list of contest entries featuring top 3 podium cards, category filters, and preview modals. | [Ch 4.3.4](file:///D:/woofskis/docs/source/4%20Proposed%20Solution%20390ca8c5bdf780a0b489efeb96dafd91.md), [Ch 11.5](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `content-operating-system/src/features/leaderboard/components/` (`IMPLEMENTED`, loads API hook) | `IMPLEMENTED` (`GET /api/v1/contests/:id/leaderboard`, M09) | `IMPLEMENTED` |

---

### 1.2 Creator Experience

| Feature | Description | Source Ref | Frontend Implementation | Backend Implementation | Overall Status |
|---|---|---|---|---|---|
| **Creator Registration & Auth** | Specialized registration form for creators (Email, Handle, Display Name, Password). Handle is UI-only; API accepts `email`, `password`, `name` (M02-P01-T06 / M02-P02). | [Ch 11.2](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `content-operating-system/src/features/auth/components/creator-register-form.tsx` + `src/services/auth-api.ts` (`IMPLEMENTED`, live API) | `cos-backend/src/controllers/auth.controller.ts:registerCreator` (`IMPLEMENTED`) | `IMPLEMENTED` |
| **Creator Dashboard** | Central dashboard showing submission counts, approved count, pending review count, and average score metrics cards. | [Ch 11.6](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `content-operating-system/src/app/(dashboard)/creator/page.tsx` (`IMPLEMENTED`) | Metrics derived from `GET /submissions/me` (M06). Dedicated `/creator/metrics` is **NOT SPECIFIED**. | `IMPLEMENTED` |
| **Video Upload Modal** | Modal supporting file selection, MP4/WebM/MOV validation, title, tags, and category selection. | [Ch 11.4](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `content-operating-system/src/features/submissions/components/upload-modal.tsx` (`IMPLEMENTED`, presign → S3 PUT → complete) | `IMPLEMENTED` (`POST /submissions/presign` + `POST /submissions/complete`) | `IMPLEMENTED` |
| **Submissions Table** | Table of user submissions showing thumbnail, status badge (`APPROVED`, `PENDING_REVIEW`, `REJECTED`), score, votes, and preview actions. | [Ch 11.6](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `content-operating-system/src/features/submissions/components/submissions-table.tsx` (`IMPLEMENTED`) | `IMPLEMENTED` (`GET /api/v1/submissions/me`) | `IMPLEMENTED` |
| **Video Preview Modal** | Dialog allowing creators to preview their uploaded video and metadata prior to and after approval. | [Ch 11.4](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `content-operating-system/src/features/submissions/components/video-preview-modal.tsx` (`IMPLEMENTED`) | N/A (Client modal) | `IMPLEMENTED` |
| **Creator Friends** | Active creators search other creators by name and manage friend requests. Accepted friends, incoming requests, and outgoing requests are listed. Source chapters do not specify this feature. | Product request (not in source chapters) | `content-operating-system/src/features/friends/` and `/creator/friends` (`IMPLEMENTED`, CREATOR only) | `Friendship` plus `/api/v1/friends` (`IMPLEMENTED`, CREATOR only) | `IMPLEMENTED` |
| **Creator Chat** | One-to-one text, emoji, image, and video messages between accepted friends. Conversation list, unread counts, and read state. Guests and admins are excluded. Source chapters do not specify this feature. | Product request (not in source chapters) | `content-operating-system/src/features/chat/` and `/creator/friends/[friendshipId]` (`IMPLEMENTED`, CREATOR only) | `ChatMessage`, `ChatRead`, `/api/v1/chat` (`IMPLEMENTED`, CREATOR only). SSE, no new socket dependency. | `IMPLEMENTED` |

---

### 1.3 Administrator & Moderation Capabilities

| Feature | Description | Source Ref | Frontend Implementation | Backend Implementation | Overall Status |
|---|---|---|---|---|---|
| **Moderation Split Viewer** | Side-by-side video playback inspector with metadata inspection, pass/fail checklists, and quick hotkey moderation. | [Ch 10.6](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md), [Ch 11.7](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `content-operating-system/src/features/admin/components/moderation-split-viewer.tsx` (`IMPLEMENTED`) | `IMPLEMENTED` (`GET /api/v1/admin/moderation/queue`, approve, reject) | `IMPLEMENTED` |
| **Rejection Reason Dialog** | Dialog capturing categorized reasons for video rejection (e.g., policy violation, poor audio, invalid format) with creator feedback. | [Ch 10.6](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md), [Ch 12.4](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md) | `content-operating-system/src/features/admin/components/reject-reason-dialog.tsx` (`IMPLEMENTED`) | `IMPLEMENTED` (`POST /api/v1/admin/submissions/:id/reject`, M07) | `IMPLEMENTED` |
| **Moderation Audit Logging** | Comprehensive modal displaying historical administrative decisions, timestamps, and moderator IDs. | [Ch 11.7](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md), [Ch 12.10](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md) | `content-operating-system/src/features/admin/components/moderation-audit-log-modal.tsx` (`IMPLEMENTED`) | `IMPLEMENTED` (`GET /api/v1/admin/moderation/audit-logs`) | `IMPLEMENTED` |
| **Contest Lifecycle Management** | Contest creation modal (title, dates, rules, prizes), status card, and management table. | [Ch 10.8](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md), [Ch 11.3](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `contest-create-modal.tsx` and `use-contests-management.ts` call `POST`/`PATCH`/`GET /api/v1/contests` (`IMPLEMENTED`, M05). Prototype pause/close actions are not sent. | `Contest`, `Category`, contest routes (`IMPLEMENTED`, M05) | `IMPLEMENTED` |
| **User Oversight (List/Detail)** | RBAC user management and profile lookups for platform administrators. | [Ch 9.3](file:///D:/woofskis/docs/source/9%20Business%20Requirements%20394ca8c5bdf780f59cb7c048b703b9f2.md), [Ch 11.2](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `PLANNED` (Admin user management table in frontend) | `GET /users` + `GET /users/:id` (`SUPER_ADMIN` only, M03-P01-T02) | `PARTIALLY_IMPLEMENTED` |

---

### 1.4 Organization & Multi-Tenant Theming

| Feature | Description | Source Ref | Frontend Implementation | Backend Implementation | Overall Status |
|---|---|---|---|---|---|
| **Brand Registration** | Onboarding form for brand accounts with organization name, slug, contact, and initial credentials. | [Ch 10.5](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md), [Ch 11.8](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `content-operating-system/src/features/auth/components/brand-register-form.tsx` (`IMPLEMENTED`) | `cos-backend/src/controllers/auth.controller.ts:registerBrand` (`IMPLEMENTED`) | `IMPLEMENTED` |
| **Brand Theme Customizer** | UI editor allowing brands to customize primary, secondary, accent colors, logos, banners, and typography in real-time. | [Ch 11.8](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md), [Ch 11.9](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `content-operating-system/src/features/admin/components/brand-theme-form.tsx` (`IMPLEMENTED`, save calls `PUT /organizations/:id/branding`) | `GET /organizations/:slug/branding` and `PUT /organizations/:id/branding` (`IMPLEMENTED`, M04) | `IMPLEMENTED` |
| **Super Admin Tenant Provisioning** | Multi-brand overview dashboard with tenant status toggles (Active/Suspended), metrics, and brand switching. | [Ch 11.8](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md) | `content-operating-system/src/app/(dashboard)/super-admin/page.tsx` (`IMPLEMENTED`) | `IMPLEMENTED` (M10: `/api/v1/super-admin/organizations`, suspend, reinstate) | `IMPLEMENTED` |
| **Tenant Suspension Overlay** | Full-screen compliance banner preventing user activity when an organization is suspended. | [Ch 12.8](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md), [Ch 12.11](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md) | `content-operating-system/src/features/admin/components/tenant-suspension-overlay.tsx` (`IMPLEMENTED`) | `IMPLEMENTED` (M10: `Organization.status` on branding API; contest writes 409 while suspended) | `IMPLEMENTED` |

---

## 2. Roadmap Phase Features Matrix

```
[ Phase 1: Woofskis MVP ] ───► [ Phase 2: Multi-Org ] ───► [ Phase 3: White-Label SaaS ] ───► [ Phase 4: Enterprise ]
- Auth & RBAC                 - Tenant CRUD               - Self-Service Billing              - Enterprise SSO / Audit
- Continuous Judging Queue    - Brand Theme Form          - Automated Provisioning            - Public REST APIs
- Creator Submissions         - Tenant-Scoped Contests    - Stripe Gateway                    - AI Moderation Engine
- Admin Split Moderation      - Category Customization    - Usage Analytics Tiering           - Multi-Region Ingest
- Dynamic Leaderboard         - Org Analytics
```
