# Woofskis AI Agent Instructions & Development Protocol

> **Workspace Root**: `D:\woofskis` (Absolute canonical root)  
> **Target Product**: Woofskis (`woofskis.com`) — Dog & Pet Video Competitions  
> **Platform**: Contest Operating System (Single-Product Independent Deployment)  
> **Last Updated**: October 2026

---

## 1. Shared Token-Efficient Workflow Rules
- **Exact Scope**: Solve only the exact feature or bug requested. Make the smallest changes necessary.
- **Targeted Inspection**: Inspect only relevant files and necessary dependencies. Avoid broad codebase exploration, repeated file reading, unnecessary research, and lengthy analysis.
- **No Unrelated Edits**: Do not refactor or modify unrelated files.
- **Verification on Demand**: Do not run builds, tests, audits, or extra verification unless explicitly requested or genuinely necessary.
- **Lean Communication**: Do not repeat the user's requirements in lengthy summaries. Ask questions only when a critical detail is missing.
- **Concise Reporting**: Report only what changed and the modified file paths.
- **Accurate Completion**: Never claim completion without actually completing the task.
- **Architecture & Docs**: Follow existing project architecture and documentation when relevant, without rereading everything.

---

## 2. Workspace Isolation & Safety
1. **Writable Scope**: `D:\woofskis` is the ONLY writable project directory. **NEVER** write, edit, delete, or touch any files outside `D:\woofskis` (e.g. `D:\cos`).
2. **Environment & Infrastructure Isolation**:
   - **NEVER** access external production databases, AWS S3 buckets, or external Cloudflare deployments.
   - **NEVER** reuse external credentials, third-party secrets, or foreign JWT secrets in Woofskis.
   - **DO NOT** deploy, start localhost/dev servers, run migrations, or execute admin bootstrap scripts unless explicitly instructed.
3. **Single-Task Focus**: Work on one module or task at a time.

---

## 3. Knowledge & Architecture Navigation
Follow existing project architecture when relevant without rereading everything:
- **Knowledge Base (`docs/knowledge/`)**: Consult specific documents only when relevant:
  - Architecture: `WOOFSKIS-ARCHITECTURE-REFERENCE.md`, `architecture.md`
  - Data & APIs: `data-model.md`, `backend-map.md`, `api-map.md`
  - Frontend: `frontend-map.md`
  - Business Rules: `business-rules.md`
- **Graphify CLI (`docs/graphify/graph-cli.js`)**: Use targeted queries when dependency tracing is needed:
  ```bash
  node docs/graphify/graph-cli.js query --node <NODE_ID>
  node docs/graphify/graph-cli.js trace-path --start <START_NODE> --end <END_NODE>
  ```

---

## 4. Post-Implementation Protocol: Updating Graph & Docs

When you finish implementing or adapting a module for Woofskis:
1. **Never Invent Rules**: If a domain rule or threshold is unspecified, treat it as `NOT SPECIFIED` and request clarification.
2. **Update Knowledge**: Update the relevant document in `docs/knowledge/` (e.g. `api-map.md`, `data-model.md`).
3. **Update Graphify**: If models, endpoints, or components were modified or added, update `docs/graphify/cos-project-graph.json`.
4. **Validate Graph**: Run `node docs/graphify/graph-cli.js validate` to ensure zero dangling edges and full schema compliance.

---

## Cursor Cloud specific instructions

The Cloud Agent VM already has Node.js 22 and npm. Environment install adds PostgreSQL 16. Environment start brings the local stack up; do not point it at hosted databases, S3, or Cloudflare.

- `policy-rc.d` blocks `service postgresql`. Start the cluster with `sudo pg_ctlcluster 16 main start`, then wait for `pg_isready`.
- The local database is `woofskis`, owned by the OS role `ubuntu`, reached with peer auth on the Unix socket: `postgresql://ubuntu@localhost/woofskis?host=/var/run/postgresql`. There is no database password.
- Start writes gitignored `backend/.env` and `frontend/.env.local`, applies `npx prisma migrate deploy` from `backend/`, and launches two tmux sessions: `woofskis-api` and `woofskis-web`.
- API: `http://localhost:5000` (`GET /api/v1/health`). Web: `http://localhost:3000`, calling `http://localhost:5000/api/v1`.
- `npm run dev` in `backend/` calls `nodemon`, which is not declared in `backend/package.json`. Start the API with `npx tsx watch src/server.ts` from `backend/`. The web app is `npx next dev -H 0.0.0.0 -p 3000` from `frontend/`.
- AWS keys are not required to boot, register a creator, or log in. Presigned video upload needs S3 and is outside local boot.
- Checks from the repo root: `npm --prefix backend run typecheck`, `npm --prefix backend test`, `npm --prefix frontend run typecheck`, `npm --prefix frontend test`, `npm --prefix infra/cloudflare/media-worker test`.
## 4. Implementation & Documentation Protocol
1. **Never Invent Rules**: If a domain rule or threshold is unspecified, treat it as `NOT SPECIFIED` and ask only if critical.
2. **Update Graph & Docs Only When Needed**: If models, endpoints, or components were modified or added, update the relevant file in `docs/knowledge/` and `docs/graphify/cos-project-graph.json`, then run `node docs/graphify/graph-cli.js validate`.
