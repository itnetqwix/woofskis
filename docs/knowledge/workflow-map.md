# Workflow Map & Business Process Flows

> **Canonical Path**: `/docs/knowledge/workflow-map.md`  
> **Source Documents**: [Ch 10 User Journey & Business Process](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md), [Ch 11 Key Features & Capabilities](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md), [Ch 12 Business Rules](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md)  
> **Code Repositories**: [content-operating-system](file:///D:/woofskis/content-operating-system/), [cos-backend](file:///D:/woofskis/cos-backend/)  
> **Last Updated**: 2026-09-22

---

## 1. Visitor / Community Voting Workflow (The Continuous Loop)

> **Source**: [Ch 10.2 Visitor Journey](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md), [Ch 10.7 Community Voting Process](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md)  
> **Frontend Implementation**: `content-operating-system/src/features/judging/hooks/use-contest-queue.ts`

```
┌─────────────────┐
│ Visitor Access  │  (Lands on Root Page / Continuous Queue)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Video Autoplays │  (Starts muted by default, loads thumbnail & streaming URL)
└────────┬────────┘
         │
         ├───► User presses [1-9 or 0] hotkey OR chooses a score (1 to 10)
         │
         ▼
┌─────────────────────────┐
│ Consensus Calculation   │  (New Score = ((PrevScore * PrevVotes) + Rating) / (PrevVotes + 1))
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Score Reveal Overlay    │  (Displays user rating, previous score, score delta, and new score)
│ (1.8s Auto-Advance Bar) │
└────────┬────────────────┘
         │
         ├───► Auto-advance timer completes (or user hits Right Arrow / 'N')
         │
         ▼
┌─────────────────────────┐
│ Next Video Ingest       │  (Advances currentIndex; resets reveal state; autoplays next video)
└────────┬────────────────┘
         │
         ├───► If all videos rated and loopMode is OFF
         │
         ▼
┌─────────────────────────┐
│ Queue Completed Screen  │  (Presents 'Restart Queue' or 'View Full Leaderboard' CTAs)
└─────────────────────────┘
```

### Key Edge Cases Handled in Workflow:
1. **Empty Contest Queue**: Displays fallback brand showcase video card *(Source: `useContestQueue.ts:138-158`)*.
2. **Keyboard Focus Conflict**: Suppresses hotkeys when active focus is within an `<input>` or `<textarea>`.
3. **Mute Preference Persistence**: Preserves audio mute preference in `localStorage.getItem('cos_viewer_muted_preference')`.

---

## 2. Creator Video Submission Workflow

> **Source**: [Ch 10.3 Creator Journey](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md), [Ch 10.6 Video Submission Process](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md)  
> **Frontend Implementation**: `content-operating-system/src/features/submissions/components/upload-modal.tsx`

```
┌───────────────────────────┐
│ Creator Dashboard Access  │  (Authenticated CREATOR; RoleGuard blocks other roles — M03-P03 verified)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Open Upload Modal         │  (Clicks "+ Submit New Video Entry")
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ File Selection & Preview  │  (Validates MP4/WebM/MOV format, video size <= 100MB, duration <= 60s)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Metadata Input            │  (Fills Title, Description, Contest Category, and Tags)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Client Validation Check   │
└─────────────┬─────────────┘
              │
              ├───► Invalid: Shows inline field errors (Yup / Formik)
              │
              └───► Valid: Submits entry payload
                    │
                    ▼
┌───────────────────────────┐
│ Submission Ingest         │  (Status set to PENDING_REVIEW; added to Creator Submissions Table)
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Moderation Queue Routing  │  (Appears in Admin Moderation Split Viewer)
└───────────────────────────┘
```

---

## 3. Administrator Content Moderation Workflow

> **Source**: [Ch 10.4 Contest Administration Journey](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md), [Ch 10.6 Video Submission Process](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md), [Ch 12.4 Video Submission Rules](file:///D:/woofskis/docs/source/12%20Business%20Rules%20394ca8c5bdf78008b70ed22f71231996.md)  
> **Frontend Implementation**: `content-operating-system/src/features/admin/components/moderation-split-viewer.tsx`

```
┌───────────────────────────────┐
│ Admin / Moderator Login       │  (BRAND_ADMIN or SUPER_ADMIN; RoleGuard on /admin/* — M03-P03 verified)
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Load Pending Review Queue     │  (Selects candidate video from Moderation Table)
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│ Split-Screen Inspection       │  (Plays video in left pane; checks audio/video quality & policy in right pane)
└───────────────┬───────────────┘
                │
        ┌───────┴──────────────────────────────┐
        │                                      │
        ▼ [ APPROVE ]                          ▼ [ REJECT ]
┌───────────────────────────────┐      ┌───────────────────────────────┐
│ Update Status -> APPROVED     │      │ Open Rejection Dialog         │
│ Emit cos_submissions_updated │      │ Select Rejection Reason & Note│
│ Ingest to Live Judging Queue  │      │ Update Status -> REJECTED     │
│ Log Audit Entry               │      │ Log Audit Entry with Reason   │
└───────────────────────────────┘      └───────────────────────────────┘
```

---

## 4. Brand Onboarding & Multi-Tenant Contest Launch Workflow

> **Source**: [Ch 10.5 Organization / Brand Journey](file:///D:/woofskis/docs/source/10%20User%20Journey%20&%20Business%20Process%20394ca8c5bdf78027b716ec91531bf108.md), [Ch 11.8 Organization & Brand Management](file:///D:/woofskis/docs/source/11%20Key%20Features%20&%20Capabilities%20394ca8c5bdf78082b980efceda5d1744.md)  
> **Frontend Implementation**: `content-operating-system/src/features/admin/components/brand-theme-form.tsx`

```
┌─────────────────────────────────┐
│ Brand Registration              │  (Brand registers via /register?type=brand with org name & slug)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Organization Profile & Theming  │  (Configures brand colors, logos, typography, header banner)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Create New Contest Instance     │  (Defines Contest Title, Start/End Dates, Categories, Prize Pool)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Publish Contest                 │  (Transitions Contest state from DRAFT to ACTIVE)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Monitor Real-Time Ingest        │  (Tracks submissions, moderation queue, votes, and leaderboard)
└─────────────────────────────────┘
```

---

## 5. End-to-End Cross-Functional Process Integration

```
[ Brand / Organization ]   ────► Launches Contest
           │
           ▼
[ Content Creator ]        ────► Submits Video Entry
           │
           ▼
[ Administrator ]          ────► Reviews in Split Moderation Queue (Approve / Reject)
           │
           ▼
[ Community Voter ]        ────► Rates Video in Continuous Queue (5 stars, values 1–5)
           │
           ▼
[ Scoring Engine ]         ────► Calculates Real-Time Community Consensus & Delta
           │
           ▼
[ Dynamic Leaderboard ]    ────► Ranks Submissions & Displays Top 3 Podium
           │
           ▼
[ Contest Closure ]        ────► Finalizes Winners & Distributes Prizes
           │
           ▼
[ Archival ]               ────► Moves Contest to Read-Only Historical Record
```

## 8. Creator friend chat

Not in the source chapters. An accepted creator opens Messages from `/creator/friends` or the Message action on an accepted friend.

```
[ Accepted friend ] ──► POST /chat/attachments/presign (optional)
                    ──► PUT private bucket
                    ──► POST /chat/conversations/:id/messages
                    ──► GET /chat/stream delivers the message to both creators
[ Recipient ]       ──► POST /chat/conversations/:id/read
```

Pending requests, guests, and admins cannot enter this flow. Contest, submission, judging, and leaderboard flows are unchanged.
