# Domain Model & Entity Taxonomy

> **Canonical Path**: `/docs/knowledge/domain-model.md`  
> **Source Documents**: [Ch 9 Business Requirements](file:///D:/woofskis/docs/source/9%20Business%20Requirements%20394ca8c5bdf780f59cb7c048b703b9f2.md), [Ch 10 User Journey & Business Process](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md), [Ch 11 Key Features & Capabilities](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md), [Ch 12 Business Rules](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md)  
> **Code Repositories**: [frontend/src/types/](file:///D:/woofskis/frontend/src/types/), [backend/prisma/schema.prisma](file:///D:/woofskis/backend/prisma/schema.prisma)  
> **Last Updated**: 2026-09-22

---

## 1. Domain Entity Taxonomy

```
┌─────────────────┐       1:N       ┌────────────────────────┐
│  Organization   ├─────────────────┤          User          │
│ (Brand / Tenant)│                 │ (Auth & Role Identity) │
└────────┬────────┘                 └───────────┬────────────┘
         │                                      │
         │ 1:N                                  │ 1:N
         ▼                                      ▼
┌─────────────────┐       1:N       ┌────────────────────────┐
│     Contest     ├─────────────────┤  Submission / Video    │
│ (Competition)   │                 │ (User Content Entry)   │
└────────┬────────┘                 └───────────┬────────────┘
         │                                      │
         │ 1:N                                  │ 1:N
         ▼                                      ▼
┌─────────────────┐                 ┌────────────────────────┐
│  Leaderboard    │                 │     Rating / Vote      │
│  (Aggregated)   │                 │ (Viewer Score Ingest)  │
└─────────────────┘                 └────────────────────────┘
```

---

## 2. Core Entities & Field Specifications

### 2.1 User
Represents an authenticated participant, creator, administrator, or brand operator.
- **Backend Model**: `backend/prisma/schema.prisma:model User` (`IMPLEMENTED`)
- **Frontend Type**: `frontend/src/types/user.ts` (`IMPLEMENTED`)
- **Attributes**:
  - `id`: UUID string (Primary Key)
  - `email`: String (Unique, validated format)
  - `passwordHash`: String (Bcrypt encrypted)
  - `name`: String
  - `role`: Enum `Role` (`SUPER_ADMIN`, `BRAND_ADMIN`, `CREATOR`, `VIEWER`)
  - `organizationId`: UUID string (Nullable, references `Organization.id`)
  - `avatarUrl`: String (Nullable) — **Frontend type/UI only.** Backend Prisma field is **PLANNED**. Persistence (required vs optional, URL validation, storage) is **NOT SPECIFIED** until decided (M02-P01-T05). Not in `schema.prisma`, JWT claims, or sanitized API user payloads.
  - `handle`: String (Nullable, unique e.g., `@alexcreates`) — **Frontend UI only** (`CreatorRegisterPayload.username`). Backend Prisma field is **PLANNED**. Persistence (uniqueness, `@` prefix, min length) is **NOT SPECIFIED** until decided (M02-P01-T05). **Dropped from the HTTP contract** (M02-P01-T06): `POST /auth/register/creator` does not accept `handle`.
  - `createdAt`: DateTime (ISO 8601)
  - `updatedAt`: DateTime (ISO 8601)

### 2.1.1 Friendship
One relationship between two creators. Not specified in the source chapters. Implemented for the creator-friends feature.
- **Backend Model**: `backend/prisma/schema.prisma:model Friendship`
- **Attributes**:
  - `userLowId` / `userHighId`: the two user ids, stored with the smaller id first. Unique together.
  - `requesterId`: the creator who sent the current pending request. Must be one of the two users.
  - `status`: `PENDING` or `ACCEPTED`
- Reject, cancel, and remove delete the row. Contest and submission rows are not related.

### 2.1.2 Creator chat
One-to-one messages between two accepted friends. Not specified in the source chapters.
- **Backend Model**: `ChatMessage`, `ChatRead` on `Friendship`
- **Attributes**:
  - `body`: text, including emoji. Empty text is allowed only when an attachment is present.
  - `attachment`: optional private image or video. Playback is a presigned URL, not a public object.
  - `ChatRead.lastReadAt`: how far this creator has read the conversation.
- Guests and `ADMIN` cannot use chat. A pending friendship cannot.

### 2.2 Organization (Tenant / Brand)
Represents an isolated brand deployment or organizational tenant within the Contest Operating System.
- **Backend Model**: `backend/prisma/schema.prisma:model Organization` (`IMPLEMENTED`)
- **Frontend Type**: `frontend/src/types/tenant.ts` (`IMPLEMENTED`)
- **Attributes**:
  - `id`: UUID string (Primary Key)
  - `name`: String (e.g., `"Woofskis Pets"`)
  - `slug`: String (Unique URL identifier e.g., `"woofskis"`)
  - `branding`: JSON object containing:
    - `primaryColor`: Hex string (e.g., `#FF4500`)
    - `secondaryColor`: Hex string
    - `accentColor`: Hex string
    - `backgroundColor`: Hex string
    - `fontFamily`: String
    - `logoUrl`: String (URL)
    - `bannerUrl`: String (URL)
    - `tagline`: String
  - `createdAt`: DateTime
  - `updatedAt`: DateTime
  - **Suspension (M10):** `status` (`ACTIVE` | `SUSPENDED`, default `ACTIVE`), `suspendedAt`, `suspensionReason` (free text). Written only by SUPER_ADMIN suspend/reinstate.

### 2.3 Contest
Represents a time-bound, category-scoped competition instance.
- **Backend Model**: `backend/prisma/schema.prisma:model Contest` (`IMPLEMENTED`, M05)
- **Frontend Type**: `frontend/src/types/contest.ts` plus admin `ContestConfigItem` in `src/types/tenant.ts`
- **Attributes**:
  - `id`: UUID / String (Primary Key, e.g., `"contest-woofskis-s1"`)
  - `tenantId` / `organizationId`: UUID (References `Organization.id`)
  - `title`: String (e.g., `"Summer Comedy Slam 2026"`)
  - `description`: String (Markdown formatted rules & overview)
  - `category`: String / Enum (e.g., `"Comedy"`, `"Pets"`, `"Talent"`, `"Sports"`, `"Music"`)
  - `status`: Enum `ContestStatus` (`DRAFT`, `SCHEDULED`, `ACTIVE`, `JUDGING`, `COMPLETED`, `ARCHIVED`)
  - `startDate`: DateTime (ISO 8601)
  - `endDate`: DateTime (ISO 8601)
  - `prizeSummary`: String (Nullable)
  - `rules`: JSON / String array
  - `autoAdvanceDelayMs`: Integer (Default: 1800 ms)
  - `createdAt`: DateTime
  - `updatedAt`: DateTime

### 2.4 Submission / Video
Represents an original video uploaded by a Creator into an active Contest.
- **Backend Model**: `IMPLEMENTED` (`backend/prisma/schema.prisma` `model Submission`, M06 + M07). `objectKey` is stored for S3 identity. Thumbnail generation is **NOT SPECIFIED** (`thumbnailUrl` nullable). `rejectionReason`, `moderatedById`, and `moderatedAt` are written by moderation.
- **Frontend Type**: `frontend/src/types/creator.ts:CreatorSubmission` (`IMPLEMENTED in UI`)
- **Attributes**:
  - `id`: UUID / String (Primary Key, e.g., `"sub-101"`)
  - `contestId`: UUID (References `Contest.id`)
  - `creatorId`: UUID (References `User.id`)
  - `title`: String
  - `description`: String (Nullable)
  - `videoUrl`: String (Streaming MP4/HLS URL)
  - `thumbnailUrl`: String (Optimized image URL)
  - `durationSeconds`: Integer (Range: 1–60s)
  - `category`: String
  - `tags`: String array
  - `status`: Enum `SubmissionStatus` (`PENDING_REVIEW`, `APPROVED`, `REJECTED`, `FLAGGED`)
  - `rejectionReason`: String (Nullable)
  - `moderatedBy`: UUID (Nullable, references `User.id`)
  - `moderatedAt`: DateTime (Nullable)
  - `communityScore`: Float (Aggregated rating, e.g., `4.7` out of `5.0`)
  - `totalVotes`: Integer (Total rating submissions)
  - `deletedAt`: DateTime (Nullable). Set when the owning creator soft-deletes the submission.
  - `deletedById`: UUID (Nullable, references `User.id`). The creator who soft-deleted the row.
  - `createdAt`: DateTime
  - `updatedAt`: DateTime

### 2.5 Rating / Vote
Represents a single score cast by a viewer evaluating a candidate video in the judging queue.
- **Backend Model**: `IMPLEMENTED` (`model Rating`, M08). Indexes on `submissionId` and `(voterFingerprint, submissionId)` are not unique.
- **Frontend Type**: `frontend/src/types/contest.ts:RatingSubmission` (`IMPLEMENTED in UI`)
- **Attributes**:
  - `id`: UUID string (Primary Key)
  - `submissionId` / `videoId`: UUID (References `Submission.id`)
  - `userId`: UUID (Nullable for anonymous voters, references `User.id`)
  - `voterFingerprint`: String (Nullable). The fingerprint algorithm is **NOT SPECIFIED**. The column stores the client value and does not hash it. A duplicate-vote window is **NOT SPECIFIED** and is not enforced.
  - `rating`: Integer (Allowed values: `1, 2, 3, 4, 5`) *(Source: [Ch 4.2](file:///D:/woofskis/docs/source/4%20Proposed%20Solution%20390ca8c5bdf780a0b489efeb96dafd91.md), [Ch 12.5](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*
  - `createdAt`: DateTime (ISO 8601)

### 2.6 Leaderboard Entry
Represents a ranked submission in a contest's dynamic leaderboard.
- **Backend Model**: Derived dynamically from `Submission` by `LeaderboardService` (`IMPLEMENTED`, M09). No separate table is required for MVP.
- **Frontend Type**: `frontend/src/types/leaderboard.ts:LeaderboardEntry` (`IMPLEMENTED in UI`)
- **Attributes**:
  - `rank`: Integer (1-indexed rank)
  - `submissionId`: UUID
  - `creatorId`: UUID
  - `creatorName`: String
  - `creatorHandle`: String
  - `creatorAvatarUrl`: String
  - `videoTitle`: String
  - `videoThumbnailUrl`: String
  - `videoUrl`: String
  - `category`: String
  - `communityScore`: Float (Rounded to 1 decimal place)
  - `totalVotes`: Integer
  - `views`: Integer
  - `trend`: Enum (`UP`, `DOWN`, `STABLE`)

### 2.7 Moderation Audit Log
Represents an immutable record of administrative actions taken on contest submissions.
- **Backend Model**: `IMPLEMENTED` (`model AuditLog`, M07). Stored actor field is `actorId`. `createdAt` is the timestamp. `metadata` may include `previousStatus`, `newStatus`, and an optional `reasonCode`. Retention is **NOT SPECIFIED**. M07 writes `APPROVE`, `REJECT`, and `FLAG` only.
- **Frontend Type**: `frontend/src/types/admin.ts:ModerationAuditLogEntry` (`IMPLEMENTED in UI`)
- **Attributes**:
  - `id`: UUID string
  - `submissionId`: UUID
  - `action`: Enum (`APPROVE`, `REJECT`, `FLAG`, `ISSUE_WARNING`, `SUSPEND_CREATOR`)
  - `moderatorId`: UUID
  - `reason`: String (Nullable)
  - `timestamp`: DateTime

---

## 3. State Machines & Status Transitions

### 3.1 Contest Lifecycle State Machine
```
[ DRAFT ] ──────────► [ SCHEDULED ] ──────────► [ ACTIVE ]
                            │                        │
                            ▼                        ▼
                        [ CANCELLED ]           [ JUDGING ]
                                                     │
                                                     ▼
                                                [ COMPLETED ]
                                                     │
                                                     ▼
                                                [ ARCHIVED ]
```
- **DRAFT**: Initial contest configuration by Brand Admin or Platform Admin.
- **SCHEDULED**: Contest parameters locked; awaiting start timestamp.
- **ACTIVE**: Open for creator video submissions and viewer voting.
- **JUDGING**: Submissions closed; voting queue open for final rating consensus.
- **COMPLETED**: Voting closed; winners finalized and announced on leaderboard.
- **ARCHIVED**: Read-only historical contest record.

M05 persists only the forward path `DRAFT → SCHEDULED → ACTIVE → JUDGING → COMPLETED → ARCHIVED`. The `CANCELLED` branch drawn above is **not** a stored status: cancellation triggers are **NOT SPECIFIED**. Settings, category, and `rules` lock once status is `ACTIVE` (BR-CONT-04), including `JUDGING`. `COMPLETED` and `ARCHIVED` reject metadata writes (BR-CONT-05). `COMPLETED → ARCHIVED` remains allowed. `SCHEDULED` stays editable; the sentence "parameters locked" on `SCHEDULED` is not a write lock.

### 3.2 Submission Moderation State Machine
```
[ UPLOADED / PENDING_REVIEW ]
         │
         ├───► [ APPROVED ]  ───► (Ingested into Judging Queue & Leaderboard)
         │
         ├───► [ REJECTED ]  ───► (Feedback sent to Creator; eligible for re-upload)
         │
         └───► [ FLAGGED ]   ───► (Escalated for senior admin review)
```

---

## 4. Unspecified Attributes & Fallback Rules
Per mandatory governance rules:
- **Exact Anti-Fraud Fingerprinting Algorithm**: `NOT SPECIFIED` in source docs.
- **Prize Payout Gateway & Tax Withholding**: `NOT SPECIFIED` (Monetization out of scope for MVP).
- **Automated AI Moderation Thresholds**: `NOT SPECIFIED` in source docs (Human moderation required for MVP).
