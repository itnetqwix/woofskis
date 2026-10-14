# Project Graph & Graphify Architecture

> **Canonical Path**: `/docs/knowledge/project-graph.md`  
> **Graph Data Store**: [`/docs/graphify/cos-project-graph.json`](file:///D:/woofskis/docs/graphify/cos-project-graph.json)  
> **Schema Validator**: [`/docs/graphify/graph-schema.json`](file:///D:/woofskis/docs/graphify/graph-schema.json)  
> **Query CLI**: [`/docs/graphify/graph-cli.js`](file:///D:/woofskis/docs/graphify/graph-cli.js)  
> **Last Updated**: 2026-09-25

---

## 1. Graphify System Overview

The **Graphify System** is a persistent, machine-readable relationship graph designed to represent the structural, operational, and architectural dependencies of the Contest Operating System.

Every node and edge in the graph is traceable to:
1. **Source Documentation**: Source chapter and section citation (e.g., `Ch 10.7`, `Ch 12.5`).
2. **Codebase Implementation**: File path and code symbol (e.g., `frontend/src/features/judging/hooks/use-contest-queue.ts:submitRating`).

---

## 2. Graph Node Taxonomies

| Node Type | Description | Example IDs |
|---|---|---|
| `Domain` | High-level business functional boundary. | `domain:auth`, `domain:judging`, `domain:contests`, `domain:moderation`, `domain:leaderboard`, `domain:multitenancy` |
| `UserRole` | Authenticated or anonymous user persona. | `role:viewer`, `role:creator`, `role:brand_admin`, `role:super_admin` |
| `Permission` | Specific RBAC authorization capability. | `perm:rate_video`, `perm:upload_video`, `perm:moderate_submission`, `perm:create_contest`, `perm:manage_tenants` |
| `Feature` | High-level product feature capability. | `feat:continuous_queue`, `feat:video_upload`, `feat:split_moderation`, `feat:leaderboard_podium`, `feat:brand_theming` |
| `Workflow` | Multi-step operational journey. | `wf:visitor_judging_loop`, `wf:creator_submission_flow`, `wf:admin_moderation_flow`, `wf:brand_contest_launch` |
| `FrontendComponent` | React / Next.js UI component. | `fe:ViewerContainer`, `fe:RatingBar`, `fe:UploadModal`, `fe:ModerationSplitViewer`, `fe:LeaderboardPodium`, `fe:LoginForm`, `fe:CreatorRegisterForm`, `fe:BrandRegisterForm`, `fe:RoleGuard` |
| `FrontendHook` | React state machine / data hook. | `fe_hook:useContestQueue`, `fe_hook:useCreatorSubmissions`, `fe_hook:useLeaderboard`, `fe_hook:useTenantTheme`, `fe_hook:useAuthSession` |
| `APIEndpoint` | Fastify REST API route. | `api:POST /auth/login`, `api:GET /users`, `api:POST /contests/:id/videos/:videoId/rate`, `api:POST /submissions/presign`, `api:GET /health` |
| `BackendService` | Fastify business logic service. | `be_svc:AuthService`, `be_svc:UserService`, `be_svc:SubmissionService`, `be_svc:JudgingService`, `be_svc:LeaderboardService` |
| `BackendRepository` | Clean architecture data access repository. | `be_repo:UserRepository`, `be_repo:ContestRepository`, `be_repo:SubmissionRepository`, `be_repo:RatingRepository` |
| `DatabaseModel` | Prisma ORM database entity. | `db:User`, `db:Organization`, `db:Contest`, `db:Submission`, `db:Rating`, `db:AuditLog` |

---

## 3. Primary Full-Stack Relationship Traversal Paths

The Graphify system enables traversing the complete vertical slice from User to Database:

### 3.1 Visitor Judging & Real-Time Voting Path
```
User: Visitor
  │  (has role)
  ▼
Role: VIEWER
  │  (has permission)
  ▼
Permission: perm:rate_video
  │  (enables feature)
  ▼
Feature: feat:continuous_queue
  │  (executes workflow)
  ▼
Workflow: wf:visitor_judging_loop
  │  (rendered by)
  ▼
Frontend: fe:ViewerContainer + fe:RatingBar + fe:ScoreRevealOverlay
  │  (managed by)
  ▼
Hook: fe_hook:useContestQueue
  │  (calls API)
  ▼
API: api:POST /contests/:id/videos/:videoId/rate [IMPLEMENTED]
  │  (handled by)
  ▼
Backend Service: be_svc:JudgingService [IMPLEMENTED]
  │  (accesses repository)
  ▼
Backend Repo: be_repo:RatingRepository [IMPLEMENTED]
  │  (persists to)
  ▼
Database: db:Rating + db:Submission [IMPLEMENTED]
```

---

### 3.2 Content Creator Video Submission Path
```
User: Creator
  │  (has role)
  ▼
Role: CREATOR
  │  (has permission)
  ▼
Permission: perm:upload_video
  │  (enables feature)
  ▼
Feature: feat:video_upload
  │  (executes workflow)
  ▼
Workflow: wf:creator_submission_flow
  │  (rendered by)
  ▼
Frontend: fe:UploadModal + fe:SubmissionsTable
  │  (managed by)
  ▼
Hook: fe_hook:useCreatorSubmissions
  │  (calls API)
  ▼
API: api:POST /submissions/presign + /complete [IMPLEMENTED]
  │  (handled by)
  ▼
Backend Service: be_svc:SubmissionService [IMPLEMENTED]
  │  (accesses repository)
  ▼
Backend Repo: be_repo:SubmissionRepository [IMPLEMENTED]
  │  (persists to)
  ▼
Database: db:Submission [IMPLEMENTED]
```

---

### 3.3 Administrator Content Moderation Path
```
User: Brand Administrator
  │  (has role)
  ▼
Role: BRAND_ADMIN
  │  (has permission)
  ▼
Permission: perm:moderate_submission
  │  (enables feature)
  ▼
Feature: feat:split_moderation
  │  (executes workflow)
  ▼
Workflow: wf:admin_moderation_flow
  │  (rendered by)
  ▼
Frontend: fe:ModerationSplitViewer + fe:RejectReasonDialog
  │  (calls API)
  ▼
API: api:POST /api/v1/admin/submissions/:id/approve [IMPLEMENTED]
  │  (handled by)
  ▼
Backend Service: be_svc:ModerationService [IMPLEMENTED]
  │  (accesses repository)
  ▼
Backend Repo: be_repo:AuditLogRepository [IMPLEMENTED]
  │  (persists to)
  ▼
Database: db:AuditLog + db:Submission [IMPLEMENTED]
```

---

## 4. Querying & Validating Graphify via CLI

The persistent Graphify system includes a Node.js CLI tool located at `docs/graphify/graph-cli.js`:

```bash
# 1. Query details of any specific node
node docs/graphify/graph-cli.js query --node "feat:continuous_queue"

# 2. Trace end-to-end full stack path
node docs/graphify/graph-cli.js trace-path --start "role:creator" --end "db:Submission"

# 3. List all nodes of a specific type (e.g., APIEndpoint, Feature, DatabaseModel)
node docs/graphify/graph-cli.js list-by-type --type APIEndpoint

# 4. Find upstream and downstream dependencies of a node
node docs/graphify/graph-cli.js inspect-edges --node "fe_hook:useContestQueue"

# 5. Validate graph schema and reference integrity
node docs/graphify/graph-cli.js validate
```
