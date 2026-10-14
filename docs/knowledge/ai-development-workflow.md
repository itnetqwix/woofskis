# AI Development Workflow Protocol

> **Canonical Path**: `/docs/knowledge/ai-development-workflow.md`  
> **Target Audience**: Future AI Coding Agents (Cursor, Antigravity, etc.)  
> **Last Updated**: 2026-09-22

---

## 1. The Core AI Development Pipeline

Every future AI coding agent operating within the Contest Operating System workspace MUST follow this 8-step protocol:

```
SOURCE DOCUMENTS (/docs/source/ — Ground Truth)
        │
        ▼
KNOWLEDGE LAYER (/docs/knowledge/ — Structured Context)
        │
        ▼
GRAPHIFY SYSTEM (/docs/graphify/ — Relationship Traversal)
        │
        ▼
RELEVANT CODE (Inspect actual frontend/backend files)
        │
        ▼
IMPLEMENTATION (Clean Architecture & Conventions)
        │
        ▼
VALIDATION (Typecheck, Lint, Tests, Zero Regressions)
        │
        ▼
KNOWLEDGE & GRAPH UPDATE (Preserve Persistent Accuracy)
```

---

## 2. Step-by-Step Execution Protocol

### Step 1: Understand the Requested Task
- Clarify whether the task pertains to a feature, bugfix, refactoring, or architectural extension.
- Identify the target persona (Visitor, Creator, Admin, Brand, Super-Admin) and domain scope.

### Step 2: Query the Graphify System
- Run graph traversal queries using `docs/graphify/graph-cli.js` to locate related nodes and full-stack paths:
  ```bash
  node docs/graphify/graph-cli.js query --node <NODE_ID>
  node docs/graphify/graph-cli.js trace-path --start <START_NODE> --end <END_NODE>
  node docs/graphify/graph-cli.js list-by-type --type <APIEndpoint | Feature | etc>
  ```
- Identify upstream and downstream dependencies across:
  $$\text{User} \longrightarrow \text{Role} \longrightarrow \text{Permission} \longrightarrow \text{Feature} \longrightarrow \text{Workflow} \longrightarrow \text{Frontend} \longrightarrow \text{API} \longrightarrow \text{Backend} \longrightarrow \text{Database}$$

### Step 3: Consult the Knowledge Layer
- Read the relevant structured knowledge document(s) under `/docs/knowledge/`:
  - Architecture questions: [architecture.md](file:///D:/woofskis/docs/knowledge/architecture.md)
  - Entity attributes / relationships: [domain-model.md](file:///D:/woofskis/docs/knowledge/domain-model.md)
  - API schemas & contracts: [api-map.md](file:///D:/woofskis/docs/knowledge/api-map.md)
  - Business rules & constraints: [business-rules.md](file:///D:/woofskis/docs/knowledge/business-rules.md)
  - Existing vs planned gaps: [implementation-status.md](file:///D:/woofskis/docs/knowledge/implementation-status.md)
- **Rule of Thumb**: Avoid re-reading all 17 source chapters for every task; use the processed knowledge layer and graph first.

### Step 4: Inspect the Actual Codebase
- Review existing code in `frontend/` or `backend/`.
- Verify existing types in `src/types/` and backend schemas in `src/schemas/`.
- Identify whether the feature is currently using mock state (LocalStorage) or real API calls.

### Step 5: Identify Cross-Layer Impact
- Check if changes require:
  1. Prisma schema migration (`backend/prisma/schema.prisma`).
  2. Fastify route / Zod schema update (`backend/src/schemas/`, `routes/`).
  3. Service & Repository pattern implementation (`backend/src/services/`, `repositories/`).
  4. Frontend Redux / React Query hook update (`frontend/src/features/...`).
  5. UI component updates matching the Tailwind / Radix design system.

### Step 6: Implement Following Existing Conventions
- Maintain Clean Architecture and Repository Pattern in the backend.
- Maintain feature-first modular structure in the frontend.
- **NEVER INVENT BUSINESS RULES**: If a requirement is not specified in `/docs/source/` or `/docs/knowledge/`, treat it as `NOT SPECIFIED` and ask or flag for clarification rather than assuming arbitrary logic.

### Step 7: Validate & Test
- Run typecheck in frontend:
  ```bash
  cd frontend && npm run typecheck
  ```
- Run typecheck, lint, and tests in backend:
  ```bash
  cd backend && npm run typecheck && npm test
  ```
- Verify zero regression in existing routes and UI interactions.

### Step 8: Update Knowledge & Graph Files
- If your change added a new endpoint, database model, or frontend component:
  1. Update `/docs/knowledge/api-map.md`, `data-model.md`, or `frontend-map.md`.
  2. Update the status in `/docs/knowledge/implementation-status.md`.
  3. Add corresponding nodes and edges in `/docs/graphify/cos-project-graph.json`.
  4. Validate graph integrity:
     ```bash
     node docs/graphify/graph-cli.js validate
     ```
