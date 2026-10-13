# Data Model & Database Schema Specification

> **Canonical Path**: `/docs/knowledge/data-model.md`  
> **Backend Repository**: [cos-backend/prisma/schema.prisma](file:///D:/woofskis/cos-backend/prisma/schema.prisma)  
> **Database Engine**: PostgreSQL 15+ (Hosted on Neon)  
> **ORM**: Prisma ORM 6.4  
> **Last Updated**: 2026-09-22

---

## 1. Implemented Database Schema

The following schema is currently implemented and active in `cos-backend/prisma/schema.prisma`.

`DATABASE_URL` is consumed by Prisma (`env("DATABASE_URL")`) and by Fastify `src/config/env.ts` → `src/config/database.ts` (`datasourceUrl`). Fastify Zod parse currently allows a missing/empty value; Prisma CLI still needs the variable set to connect. See M01-P01-T02.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  SUPER_ADMIN
  BRAND_ADMIN
  CREATOR
  VIEWER
}

enum OrganizationStatus {
  ACTIVE
  SUSPENDED
}

model Organization {
  id               String             @id @default(uuid())
  name             String
  slug             String             @unique
  branding         Json?
  status           OrganizationStatus @default(ACTIVE)
  suspendedAt      DateTime?
  suspensionReason String?            @db.Text
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt
  users            User[]
  categories       Category[]
  contests         Contest[]

  @@map("organizations")
}

model User {
  id                   String        @id @default(uuid())
  email                String        @unique
  passwordHash         String
  name                 String
  role                 Role          @default(CREATOR)
  organizationId       String?
  organization         Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)
  createdAt            DateTime      @default(now())
  updatedAt            DateTime      @updatedAt
  submissions          Submission[]  @relation("CreatedByUser")
  moderatedSubmissions Submission[]  @relation("ModeratedByUser")
  auditLogs            AuditLog[]
  ratings              Rating[]

  // handle and avatarUrl are domain-model PLANNED fields.
  // Persistence (nullability, uniqueness, @-prefix format) is NOT SPECIFIED
  // for this schema until a later decision (M02-P01-T05). Do not add without
  // an explicit roadmap task.

  @@map("users")
}

enum ContestStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  JUDGING
  COMPLETED
  ARCHIVED
}

model Category {
  id             String       @id @default(uuid())
  name           String
  slug           String
  description    String?
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  contests       Contest[]
  createdAt      DateTime     @default(now())

  @@unique([organizationId, slug])
  @@map("categories")
}

model Contest {
  id                 String        @id @default(uuid())
  organizationId     String
  organization       Organization  @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  categoryId         String?
  category           Category?     @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  title              String
  description        String        @db.Text
  status             ContestStatus @default(DRAFT)
  startDate          DateTime
  endDate            DateTime
  prizeSummary       String?
  rules              Json?
  autoAdvanceDelayMs Int           @default(1800)
  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt
  submissions        Submission[]

  @@index([organizationId, status])
  @@map("contests")
}

enum SubmissionStatus {
  PENDING_REVIEW
  APPROVED
  REJECTED
  FLAGGED
}

model Submission {
  id              String           @id @default(uuid())
  contestId       String
  contest         Contest          @relation(fields: [contestId], references: [id], onDelete: Cascade)
  creatorId       String
  creator         User             @relation("CreatedByUser", fields: [creatorId], references: [id], onDelete: Cascade)
  title           String
  description     String?          @db.Text
  videoUrl        String
  objectKey       String           @unique
  thumbnailUrl    String?
  durationSeconds Int
  status          SubmissionStatus @default(PENDING_REVIEW)
  rejectionReason String?          @db.Text
  moderatedById   String?
  moderatedBy     User?            @relation("ModeratedByUser", fields: [moderatedById], references: [id], onDelete: SetNull)
  moderatedAt     DateTime?
  tags            String[]
  communityScore  Float            @default(0)
  totalVotes      Int              @default(0)
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt
  ratings         Rating[]
  auditLogs       AuditLog[]

  @@index([contestId, status])
  @@index([creatorId])
  @@map("submissions")
}

enum AuditAction {
  APPROVE
  REJECT
  FLAG
  ISSUE_WARNING
  SUSPEND_CREATOR
}

model AuditLog {
  id           String      @id @default(uuid())
  submissionId String?
  submission   Submission? @relation(fields: [submissionId], references: [id], onDelete: SetNull)
  actorId      String
  actor        User        @relation(fields: [actorId], references: [id], onDelete: Cascade)
  action       AuditAction
  reason       String?     @db.Text
  metadata     Json?
  createdAt    DateTime    @default(now())

  @@index([actorId])
  @@index([submissionId])
  @@map("audit_logs")
}

model Rating {
  id               String     @id @default(uuid())
  submissionId     String
  submission       Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  userId           String?
  user             User?      @relation(fields: [userId], references: [id], onDelete: SetNull)
  voterFingerprint String?
  rating           Int
  createdAt        DateTime   @default(now())

  @@index([submissionId])
  @@index([voterFingerprint, submissionId])
  @@map("ratings")
}
```

---

### 1.1 User `handle` / `avatarUrl` gap (M02-P01-T05)

`docs/knowledge/domain-model.md` lists `handle` (nullable unique) and `avatarUrl` (nullable) on User. **Neither column exists** in the implemented Prisma `User` model above.

| Field | Domain-model | Prisma (`schema.prisma`) | Auth API payloads | Persistence decision |
|---|---|---|---|---|
| `handle` | PLANNED (nullable, unique, e.g. `@alexcreates`) | **Absent** | **Absent** (`SanitizedUser` / JWT claims) | **NOT SPECIFIED** until decided. Frontend creator form requires `username` (UI only). |
| `avatarUrl` | PLANNED (nullable) | **Absent** | **Absent** | **NOT SPECIFIED** until decided. Frontend `AuthUser.avatarUrl` is prototype-only. |

Do **not** add these columns without an explicit later task. Uniqueness, `@` prefix storage, URL validation, and whether register requires them are **NOT SPECIFIED** in `/docs/source`. JWT claims remain `{ id, email, role, organizationId }` only.

**M02-P01-T06:** `handle` was **dropped from the API contract** instead of adding a Prisma field. `POST /api/v1/auth/register/creator` accepts `email`, `password`, `name` only.

---

### 1.2 Organization status / suspension (M04-P01-T01)

Confirmed Organization columns: `id`, `name`, `slug`, `branding`, `createdAt`, `updatedAt`, relation `users`.

**Decision: do not add `status` or `suspended`.**

| Checked | Result |
|---|---|
| Prisma `Organization` | No status column |
| `domain-model.md` §2.2 | No status attribute |
| Frontend `TenantBrandConfig.status` | Local prototype `ACTIVE` \| `SUSPENDED` plus `suspensionReason`, `suspendedAt`, `suspendedBy` |
| Source Ch 12.2 / 12.8 | Accounts or contests may be suspended. No Organization column name |
| Master plan M04 | Exact `Organization.suspended` field name is **NOT SPECIFIED** |
| Master plan M10 | Suspend/reinstate APIs and “Organization suspension/status fields” are a later module |

M04 has no suspend or reinstate route. Adding a column would invent the field name, enum, default, and write path that M10 has not specified. The suspension overlay keeps reading the local prototype until M10.

**M10 update (approved decision, progress Amendment 2026-09-25).** The M04 decision above is superseded:

| Column | Type | Rule |
|---|---|---|
| `status` | `OrganizationStatus` enum `ACTIVE` \| `SUSPENDED` | Default `ACTIVE`. Existing rows became `ACTIVE`. |
| `suspendedAt` | `DateTime?` | Set to the current time on suspend; `null` on reinstate. |
| `suspensionReason` | `String?` (`TEXT`) | Required free text on suspend; `null` on reinstate. No reason taxonomy. |

Migration `20260925200000_m10_organization_suspension` (incremental SQL, applied with `prisma db execute`). Written only by the SUPER_ADMIN suspend/reinstate routes. No expiry, appeal, or automatic suspension state.

No Prisma migration was created for M04 (M04-P01-T05). `branding Json?` already existed.

---

### 1.3 Contest and Category (M05)

Implemented in `schema.prisma`. Migration directory: `prisma/migrations/20260924180000_m05_contest_lifecycle`. `prisma validate` and `prisma generate` passed. `prisma migrate deploy` returns `P3005` because Neon already had Organization and User from earlier `db push` work and has no baseline migration history. The incremental SQL was applied with `prisma db execute`. `prisma migrate diff` from the live database to `schema.prisma` is empty.

`ContestStatus`: `DRAFT`, `SCHEDULED`, `ACTIVE`, `JUDGING`, `COMPLETED`, `ARCHIVED`.

The pre-M05 planned snippet below also lists `CANCELLED`. That value is **not** in the implemented enum. Cancellation triggers are **NOT SPECIFIED**. No submission relation was added (M06).

`Category` has `organizationId` and `@@unique([organizationId, slug])`. `Contest` has optional `categoryId`, `prizeSummary`, `rules` JSON, `autoAdvanceDelayMs` default `1800`, `submissions Submission[]` (M06), and `@@index([organizationId, status])`. Evaluation criteria and prize distribution are **NOT SPECIFIED** as columns.

Organization gained `categories` and `contests` relations. User gained `submissions` in M06.

---

### 1.4 Submission (M06)

Implemented in `schema.prisma`. Migration directory: `prisma/migrations/20260925100000_m06_submission`. `prisma validate` and `prisma generate` passed. Incremental SQL was applied with `prisma db execute` (same P3005 baseline situation as M05). `prisma migrate diff` from the live database to `schema.prisma` is empty.

`SubmissionStatus`: `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `FLAGGED`. New rows default to `PENDING_REVIEW`. Approve, reject, and flag writes are M07 (section 1.5).

Implemented fields (master plan M06-P01-T02 plus M07 decision columns): `contestId`, `creatorId`, `title`, `description`, `videoUrl`, `objectKey` (unique), `thumbnailUrl` (optional — generation is **NOT SPECIFIED**), `durationSeconds`, `status`, `rejectionReason`, `moderatedById`, `moderatedAt`, `tags`, `communityScore` default `0`, `totalVotes` default `0`, plus `id` / `createdAt` / `updatedAt`.

Creator soft delete adds nullable `deletedAt` and `deletedById` (`User`, `ON DELETE SET NULL`). Migration file: `prisma/migrations/20261011170000_submission_soft_delete`. It is additive and is not applied by the application at startup. Existing rows stay active (`deletedAt` null). Soft delete does not remove the row, ratings, or the S3 object. A permanent retention policy is **NOT SPECIFIED**.

Indexes: `@@index([contestId, status])`, `@@index([creatorId])`.

`communityScore` and `totalVotes` are updated by `JudgingService` when a rating is accepted (M08). `Rating` is section 1.6.

S3 presign/complete does not add a table. `POST /submissions/presign` returns a PUT URL for `objectKey` `contests/{contestId}/creators/{creatorId}/{uuid}.{mp4|webm|mov}`. `POST /submissions/complete` stores that key and an unsigned virtual-hosted `videoUrl`. Playback signs a GET from `objectKey` when the row is returned. Signed URLs are not stored.

---

### 1.5 AuditLog and moderation columns (M07)

Implemented in `schema.prisma`. Migration directory: `prisma/migrations/20260925160000_m07_moderation_audit`. `prisma validate` and `prisma generate` passed. Incremental SQL was applied with `prisma db execute` (same P3005 baseline as M05/M06). `prisma migrate diff` from the live database to `schema.prisma` is empty.

`AuditAction`: `APPROVE`, `REJECT`, `FLAG`, `ISSUE_WARNING`, `SUSPEND_CREATOR`. M07 writes only `APPROVE`, `REJECT`, and `FLAG`. Warning and creator-suspension endpoints are not part of M07.

`AuditLog` (`audit_logs`): `id`, optional `submissionId`, `actorId`, `action`, optional `reason`, optional `metadata` JSON, `createdAt`. Indexes on `actorId` and `submissionId`. Append-only repository (create + list). Retention / purge is **NOT SPECIFIED**.

`metadata` stores `previousStatus`, `newStatus`, and `reasonCode` when the client sends one. Source chapters do not enumerate rejection categories, so `reasonCode` is not a closed allowlist.

Decisions leave `PENDING_REVIEW` only. `COMPLETED` and `ARCHIVED` contests reject moderation writes (BR-CONT-05). FLAGGED escalation after the status change is **NOT SPECIFIED**. No HTTP flag route is registered.

---

### 1.6 Rating (M08)

Implemented in `schema.prisma`. Migration directory: `prisma/migrations/20260925180000_m08_rating`. `prisma validate` and `prisma generate` passed. Incremental SQL was applied with `prisma db execute` (same P3005 baseline as M05–M07). `prisma migrate diff` from the live database to `schema.prisma` is empty.

`Rating` (`ratings`): `id`, `submissionId`, optional `userId`, optional `voterFingerprint`, `voterIpHash` (HMAC of the client IP, not the raw address), `rating` (integer; new votes 1–10, historical 1–5 rows remain), `createdAt`. Unique `(submissionId, voterIpHash)`. Indexes: `submissionId`, `(voterFingerprint, submissionId)`.

`Contest` also stores optional `tagline`, `bannerUrl`, `bannerObjectKey`, `thumbnailUrl`, `timezone` (IANA, default `Asia/Kolkata`), and `votingClosesAt`. `startDate` is submission opening and `endDate` is the submission deadline. Both are absolute timestamps. `bannerObjectKey` is the stable private-bucket reference. `bannerUrl` on read is a short-lived signed GET when a key exists, otherwise the legacy URL. Prize breakdown beyond `prizeSummary` is not a column. Contest deletion is a hard delete. `Submission` and `Rating` cascade from the contest. `AuditLog.submissionId` is set null. `ACTIVE` and `JUDGING` are not deletable. Migration: `prisma/migrations/20261011120000_contest_banner_timezone_schedule`.

`userId` is null for anonymous visitors. Authenticated `VIEWER` ratings store `userId`. The fingerprint algorithm, duplicate-vote window, and retry/idempotency are **NOT SPECIFIED**. No leaderboard table was added.

---

## 2. Implemented Model History & MVP Completion

All core models (`Organization`, `User`, `Contest`, `Category`, `Submission`, `Rating`, `AuditLog`) have been fully implemented in `cos-backend/prisma/schema.prisma` across modules M01–M10:
- **M01/M02**: Foundation `Organization` and `User` models.
- **M04/M10**: `Organization` multi-tenancy, `branding Json?`, `OrganizationStatus` (`ACTIVE` | `SUSPENDED`), `suspendedAt`, `suspensionReason`.
- **M05**: `Contest`, `Category`, `ContestStatus` (DRAFT → SCHEDULED → ACTIVE → JUDGING → COMPLETED → ARCHIVED).
- **M06**: `Submission`, `SubmissionStatus` (PENDING_REVIEW, APPROVED, REJECTED, FLAGGED), S3 objectKey, videoUrl.
- **M07**: `AuditLog`, `AuditAction` (APPROVE, REJECT, FLAG, ISSUE_WARNING, SUSPEND_CREATOR), moderation audit fields on `Submission`.
- **M08**: `Rating` model, consensus scoring fields (`communityScore`, `totalVotes`) on `Submission`.
- **M09**: Leaderboard derived views and merit ranking.

M11, M12, and M13 add no models and no migrations. `handle` / `avatarUrl` stay absent. Notifications and payout tables are out of MVP.

---

## 3. JSON Field Schemas

### `Organization.branding` Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "primaryColor": { "type": "string", "pattern": "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" },
    "secondaryColor": { "type": "string", "pattern": "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" },
    "accentColor": { "type": "string", "pattern": "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" },
    "backgroundColor": { "type": "string", "pattern": "^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$" },
    "fontFamily": { "type": "string" },
    "logoUrl": { "type": "string", "format": "uri" },
    "bannerUrl": { "type": "string", "format": "uri" },
    "tagline": { "type": "string" }
  },
  "required": ["primaryColor", "logoUrl"]
}
```

---

## 4. Indexing & Performance Strategy
1. **Multi-Tenant Isolation Index**: `@@index([organizationId, status])` ensures tenant-scoped contest listings execute in $O(\log N)$ time.
2. **Leaderboard Aggregation Index**: `@@index([contestId, status, communityScore])` enables rapid retrieval of top-ranked approved entries.
3. **Anti-Fraud Fingerprint Index**: `@@index([voterFingerprint, submissionId])` enables rapid lookup to detect duplicate ratings.

## 5. Creator friendships (additive)

`Friendship` stores one row per unordered creator pair (`userLowId` < `userHighId`, unique). `requesterId` must be one of those ids. Status is `PENDING` or `ACCEPTED`. Deleting either user cascades the row. The migration is `prisma/migrations/20261011180000_creator_friendships`. It does not alter contest, submission, rating, or leaderboard tables. Apply it on a database before the friends API is used. This change does not apply it.

`ChatMessage` and `ChatRead` hang off an accepted friendship. Deleting the friendship cascades both. `ChatMessage.body` is optional text (emoji included) up to 2000 characters, an engineering default. A product body limit is **NOT SPECIFIED**. An optional private attachment stores `attachmentKey`, `attachmentKind` (`IMAGE` | `VIDEO`), `attachmentMime`, and `attachmentBytes`. The key pattern is `chat/{friendshipId}/{senderId}/{uuid}.{ext}`. The byte ceiling reuses the 100MB media limit. `ChatRead` is one `(friendshipId, userId)` row whose `lastReadAt` marks what that creator has seen. Unread messages are those from the other creator with `createdAt` after that timestamp. A database trigger rejects a sender or reader who is not one of the two accepted friends. The migration is `prisma/migrations/20261011220000_creator_chat`. It does not alter contest, submission, rating, or leaderboard tables. Apply it before the chat API is used. This change does not apply it.
