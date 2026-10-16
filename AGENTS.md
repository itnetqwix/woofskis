# Woofskis AI Agent Instructions & Development Protocol

> **Workspace Root**: `D:\woofskis` (Absolute canonical root)  
> **Target Product**: Woofskis (`woofskis.com`) — Dog & Pet Video Competitions  
> **Platform**: Contest Operating System (Single-Product Independent Deployment)  
> **Last Updated**: October 2026

---

## 1. Golden Rules of Workspace Isolation & Safety

1. **Only Writable Project is `D:\woofskis`**:
   - `D:\woofskis` is the ONLY writable project directory.
   - **NEVER** write, edit, delete, or touch any files in `D:\cos` or outside `D:\woofskis`.
2. **Strict Environment & Infrastructure Isolation**:
   - **NEVER** access external production databases, AWS S3 buckets, or external Cloudflare deployments.
   - **NEVER** reuse external credentials, third-party secrets, or foreign JWT secrets in Woofskis.
   - **DO NOT** deploy, start localhost/dev servers, run migrations, or execute admin bootstrap scripts unless explicitly instructed by the user.
3. **Single-Task Focus**:
   - Work on **one module or task at a time**.
   - Always report the specific files changed, verification results, and any remaining gaps at the end of each turn.

---

## 2. Graphify & Knowledge Navigation Hierarchy

To avoid wasteful whole-codebase scans and context window pollution, adhere strictly to this discovery sequence:

1. **GRAPHIFY QUERY** (`docs/graphify/graph-cli.js`) — Query node metadata or trace full-stack vertical slices.
2. **STRUCTURED KNOWLEDGE** (`docs/knowledge/`) — Read module specifications and contracts.
3. **TARGETED SOURCE INSPECTION** — Inspect only the specific files identified in steps 1 & 2.
4. **IMPLEMENTATION** — Maintain Clean Architecture and feature-first patterns.
5. **VERIFICATION** — Run typecheck, lint, and tests for the modified module.
6. **GRAPH & KNOWLEDGE UPDATE** — Update documentation and Graphify nodes, then run `graph-cli.js validate`.

### Essential Graphify Commands
All Graphify commands must be executed locally from the repository root:
```bash
# 1. Print overall graph statistics
node docs/graphify/graph-cli.js stats

# 2. Query node metadata and outgoing/incoming edges
node docs/graphify/graph-cli.js query --node <NODE_ID>
# Examples:
# node docs/graphify/graph-cli.js query --node "domain:judging"
# node docs/graphify/graph-cli.js query --node "api:POST /auth/login"

# 3. Trace full vertical slice from role to database
node docs/graphify/graph-cli.js trace-path --start <START_NODE> --end <END_NODE>
# Example:
# node docs/graphify/graph-cli.js trace-path --start "role:creator" --end "db:Submission"

# 4. List nodes by taxonomy type
node docs/graphify/graph-cli.js list-by-type --type <APIEndpoint|Feature|DatabaseModel|etc>

# 5. Validate integrity of all nodes and edges
node docs/graphify/graph-cli.js validate
```

---

## 3. Knowledge Layer Reference Directory

Consult structured documentation in `docs/knowledge/` before writing code:
- **[WOOFSKIS-ARCHITECTURE-REFERENCE.md](docs/knowledge/WOOFSKIS-ARCHITECTURE-REFERENCE.md)**: Full 13-module architecture map, resource checklists, and dependency orders.
- **[architecture.md](docs/knowledge/architecture.md)**: End-to-end architecture and module boundaries.
- **[data-model.md](docs/knowledge/data-model.md)**: Prisma schema specifications and relationship constraints.
- **[backend-map.md](docs/knowledge/backend-map.md)**: Fastify routes, controllers, services, and repositories.
- **[frontend-map.md](docs/knowledge/frontend-map.md)**: Next.js 14 App Router, feature modules, hooks, and UI components.
- **[api-map.md](docs/knowledge/api-map.md)**: REST API contracts and Zod payload schemas.
- **[business-rules.md](docs/knowledge/business-rules.md)**: Community consensus scoring formulas (1–10 rating scale), contest state machines, and rate limits.

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
