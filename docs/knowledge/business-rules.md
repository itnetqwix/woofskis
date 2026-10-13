# Business Rules & Governance Specification

> **Canonical Path**: `/docs/knowledge/business-rules.md`  
> **Source Documents**: [Ch 12 Business Rules](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md), [Ch 13 Assumptions & Constraints](file:///D:/woofskis/docs/source/13%20Assumptions%20&%20Constraints%20395ca8c5bdf78075bee7f07e22404768.md), [Ch 4 Proposed Solution](file:///D:/woofskis/docs/source/4%20Proposed%20Solution%20390ca8c5bdf780a0b489efeb96dafd91.md)  
> **Code Repositories**: [content-operating-system](file:///D:/woofskis/content-operating-system/), [cos-backend](file:///D:/woofskis/cos-backend/)  
> **Last Updated**: 2026-09-22

---

## 1. Non-Negotiable Platform Constraints vs Configurable Options

Per **[Ch 13.13 Non-Negotiable Platform Constraints](file:///D:/woofskis/docs/source/13%20Assumptions%20&%20Constraints%20395ca8c5bdf78075bee7f07e22404768.md)**, there is a strict boundary between what organizations can customize versus what remains platform-controlled:

```
┌──────────────────────────────────────┐     ┌──────────────────────────────────────┐
│       ORGANIZATIONS MAY CONFIGURE    │     │     CENTRAL PLATFORM GOVERNANCE      │
│      (Brand Admin Configurable)      │     │       (CANNOT BE OVERRIDDEN)         │
├──────────────────────────────────────┤     ├──────────────────────────────────────┤
│ • Organization Profile & Brand Name  │     │ • Core Authentication Mechanism      │
│ • Logos, Banners, & Color Themes     │     │ • User Identity & RBAC Enforcement   │
│ • Contest Categories & Schedules     │     │ • Community Voting & Consensus Engine│
│ • Contest Descriptions & Rules Copy  │     │ • Fraud Prevention & Vote Validation │
│ • Contest Prize Summaries            │     │ • Core Moderation Pipeline & Auditing│
│ • Custom Homepage Banners            │     │ • Security & Data Protection Policies│
│ • Communication & Email Templates    │     │ • Platform Architecture & DB Schemas │
└──────────────────────────────────────┘     └──────────────────────────────────────┘
```

---

## 2. Core Business Rules by Domain

### 2.1 User Eligibility & Account Governance
- **Rule BR-USER-01**: Users must register and authenticate before uploading videos or participating as creators *(Source: [Ch 12.2](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.
- **Rule BR-USER-02**: Each registered account shall represent a single individual creator or authorized organization entity *(Source: [Ch 12.2](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.
- **Rule BR-USER-03**: Accounts found violating platform conduct or submission safety policies are subject to immediate suspension or permanent removal *(Source: [Ch 12.2](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.
- **Minimum Age Requirement**: `NOT SPECIFIED` in source documentation.

---

### 2.2 Contest Participation & Lifecycle Rules
- **Rule BR-CONT-01**: Participants may submit entries only to active contests within the open submission window (`startDate <= now <= endDate`) *(Source: [Ch 12.3](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.
- **Rule BR-CONT-02**: Every submission must belong to an eligible, active contest category *(Source: [Ch 12.3](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.
- **Rule BR-CONT-03**: Submissions uploaded after contest expiration deadlines shall not be accepted *(Source: [Ch 12.3](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.
- **Rule BR-CONT-04**: Contest settings, categories, and evaluation criteria cannot be modified once a contest transitions to `ACTIVE` status *(Source: [Ch 12.6](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.
- **Rule BR-CONT-05**: Concluded/closed contests become read-only historical records *(Source: [Ch 12.6](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.
- **Max Submissions per Creator per Contest**: `NOT SPECIFIED` in source documentation.

---

### 2.3 Video Submission & Moderation Rules
- **Rule BR-VID-01**: All submitted videos must pass moderation review prior to being published in the public judging queue or leaderboard *(Source: [Ch 12.4](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.
- **Rule BR-VID-02**: Rejected videos must provide a categorized rejection reason and optional reviewer feedback to the creator *(Source: [Ch 10.6](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md), [Ch 12.4](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.
- **Rule BR-VID-03**: Video file formats must be MP4, WebM, or MOV (`video/mp4`, `video/webm`, `video/quicktime`) with a maximum duration of 60 seconds and maximum file size of 100MB *(Source: `content-operating-system/src/features/submissions/components/upload-modal.tsx`)*.
- **Moderation SLA / Turnaround Time Target**: `NOT SPECIFIED` in source documentation (Identified as operational SLA to be configured by platform operators).

---

### 2.4 Community Voting & Consensus Scoring Rules
- **Rule BR-VOTE-01**: Votes shall only be accepted for approved, published contest videos within active judging windows *(Source: [Ch 12.5](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*. M08 allowed contest statuses: `ACTIVE` and `JUDGING` (domain-model §3.1). `DRAFT`, `SCHEDULED`, `COMPLETED`, and `ARCHIVED` reject votes.
- **Rule BR-VOTE-02**: New rating values must be integers in the range $[1, 10]$. Stored historical ratings of 1–5 stay valid and are not migrated. The running average uses every stored rating. *(Product decision, 2026-10-07. Earlier source chapters described 1–5.)*
- **Rule BR-VOTE-03 (Scoring Formula)**: The new community consensus score is calculated as:
  $$\text{NewScore} = \text{round}\left(\frac{\text{PreviousScore} \times \text{PreviousVotes} + \text{Rating}}{\text{PreviousVotes} + 1}, 1\right)$$
  $$\Delta = \text{round}(\text{NewScore} - \text{PreviousScore}, 1)$$
- **Rule BR-VOTE-04**: An auto-advance delay of 1,800 ms (1.8s) occurs after vote submission to reveal the consensus score before loading the next video *(Source: `useContestQueue.ts:AUTO_ADVANCE_DELAY_MS`)*.
- **Guest repeat vote**: one current rating per submission and hashed client IP. The hash is HMAC-SHA256 of Fastify `request.ip`, keyed by `JWT_SECRET`. The raw IP is not stored or returned. The same identifier may rate a different video. A later rating from the same identifier updates that row and does not add a vote. The updated score is \(\text{round}((\text{PreviousScore} \times \text{totalVotes} - \text{previousRating} + \text{rating}) / \text{totalVotes}, 1)\). Two first-time inserts that hit `@@unique([submissionId, voterIpHash])` still return **409**. This is not one physical phone: shared networks share an address, and a phone can change address. `voterFingerprint` is optional metadata and is not the uniqueness key.

---

### 2.5 Winner Determination & Leaderboard Rules
- **Rule BR-WIN-01**: Contest winners are ranked strictly in descending order of calculated `communityScore` (with `totalVotes` breaking ties) *(Source: [Ch 12.7](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md), `content-operating-system/src/features/leaderboard/hooks/use-leaderboard.ts`)*.
- **Rule BR-WIN-02**: Disqualified or rejected entries are immediately purged from active leaderboard rankings *(Source: [Ch 12.7](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.
- **Rule BR-WIN-03**: Final rankings become official and immutable upon contest closure and publication *(Source: [Ch 12.7](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md))*.
- **Minimum Votes Required for Official Placement**: `NOT SPECIFIED` in source documentation.
- **Creator soft delete**: A creator may soft-delete only their own submission. `deletedAt` and `deletedById` are set. The row, rating history, and stored video stay. The video leaves the creator list, public leaderboard, judging queue, moderation queue, comments, and new ratings. Admins still see the title, creator, contest, `deletedAt`, and deleting actor. Repeating the delete keeps the original timestamp. Admin hard delete remains a separate admin route. Permanent media retention is **NOT SPECIFIED**.

---

## 3. Explicitly Unspecified Rules Inventory

To prevent inventing undocumented logic, the following items are formally registered as **NOT SPECIFIED**:
1. **Creator Payout Calculation**: `NOT SPECIFIED` (Monetization out of scope for MVP).
2. **Automated Fraud Scoring Heuristics**: `NOT SPECIFIED` (Manual review + basic rate-limiting for MVP). M12 implements only these engineering defaults, which are not business-rule thresholds: each of `POST /auth/login` and `POST /auth/register/creator` allows 10 requests per 15 minutes per IP; `POST /contests/:id/videos/:videoId/rate` allows 60 requests per minute per IP. `POST /auth/register/brand` is not registered. Duplicate-vote detection remains **NOT SPECIFIED**.
3. **Maximum Concurrent Contests per Brand**: `NOT SPECIFIED`.
4. **Creator Age Restriction**: `NOT SPECIFIED`.
5. **Video Bitrate / Transcoding Profiles**: `NOT SPECIFIED`.
6. **Organization status / suspension**: resolved by the approved M10 decision (progress Amendment 2026-09-25): `status` `ACTIVE` | `SUSPENDED`, `suspendedAt`, free-text `suspensionReason`; SUPER_ADMIN only. A suspended organization blocks contest create/PATCH (409). Expiry, appeals, notifications, automatic suspension, and login/creator blocking remain **NOT SPECIFIED**. `BRAND_ADMIN` branding writes are limited to JWT `organizationId`. Slug changes, organization deletion, invitations, and multi-organization membership are **NOT SPECIFIED**.
7. **Creator friends**: not specified in the source chapters. Implemented limits that are engineering choices, not source rules: name search only (no email), 20 results, blocked creators omitted, and a deleted request can be sent again. Phase 2 chat is also not in the source chapters. Engineering defaults, not source rules: message body 2000 characters, history page 40 (max 100), preview 80 characters, attachment ceiling 100MB, image types JPEG/PNG/WebP/GIF, video types MP4/WebM/MOV. Real-time delivery is server-sent events on one API process.
