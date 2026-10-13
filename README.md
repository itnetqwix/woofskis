# Woofskis Workspace

> **Target Domain**: `woofskis.com`  
> **Platform**: Contest Operating System (Single-Product Deployment)  
> **Status**: Independent workspace for the Woofskis video competition platform. Pending environment provisioning.

---

## 1. Project Overview & Structure

Woofskis is an independent, single-product deployment of the Contest Operating System tailored for dog/pet video competitions at `woofskis.com`.

```
D:\woofskis\
|-- content-operating-system/   # Frontend: Next.js 14 App Router, TailwindCSS, Redux Toolkit, React Query
|-- cos-backend/                # Backend: Fastify 5 REST API, Prisma ORM 6, PostgreSQL
|-- infra/                      # Infrastructure configs (Cloudflare media streaming worker)
|   \-- cloudflare/media-worker/
|-- .cursor/rules/              # Project instructions & Clean Architecture guidelines
|-- docs/
|   |-- graphify/               # Relationship graph tooling & schema for Woofskis architecture
|   \-- knowledge/              # Architecture specifications, API maps, and replication reference report
|-- .gitignore                  # Monorepo root ignore rules
\-- README.md                   # Workspace overview & setup checklist
```

---

## 2. Pending Environment Setup & Prerequisites

Before running this application, the following independent resources must be provisioned. **Ensure all secrets, credentials, and databases are strictly unique to Woofskis.**

### 2.1 Backend (`cos-backend/.env`)
Create `cos-backend/.env` based on `cos-backend/.env.example`:
- `PORT=5000`
- `NODE_ENV=development` (or `production`)
- `DATABASE_URL`: Dedicated PostgreSQL database connection string for Woofskis.
- `JWT_SECRET`: High-entropy random secret key unique to Woofskis.
- `LOG_LEVEL=info`
- `AWS_REGION`: AWS S3 region (e.g. `us-east-2`).
- `AWS_S3_BUCKET`: Dedicated private S3 bucket (e.g. `woofskis-production-media`).
- `AWS_ACCESS_KEY_ID`: Dedicated AWS IAM credentials with S3 read/write scoped to the Woofskis bucket.
- `AWS_SECRET_ACCESS_KEY`: AWS IAM secret key.

### 2.2 Frontend (`content-operating-system/.env.local`)
Create `content-operating-system/.env.local` based on `content-operating-system/.env.example`:
- `NEXT_PUBLIC_APP_NAME="Woofskis"`
- `NEXT_PUBLIC_APP_DESCRIPTION="The Premier Dog Video Competition Platform"`
- `NEXT_PUBLIC_APP_URL="http://localhost:3000"` (Production: `https://woofskis.com`)
- `NEXT_PUBLIC_API_BASE_URL="http://localhost:5000/api/v1"` (Production: `https://api.woofskis.com/api/v1`)
- `NEXT_PUBLIC_API_TIMEOUT=15000`
- `NODE_ENV=development`

### 2.3 Cloudflare Media Worker (`infra/cloudflare/media-worker/`)
Configure `wrangler.toml` with:
- `name = "woofskis-media"`
- `AWS_REGION = "us-east-2"`
- `S3_BUCKET = "woofskis-production-media"`
- Configure Wrangler secrets for `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

---

## 3. Database Initialization (When Ready)

1. Generate Prisma Client:
   `npm --prefix cos-backend run prisma generate` (after `npm install`)
2. Apply database migrations to the fresh database:
   `npx prisma migrate deploy`
3. Provision the initial Woofskis platform administrator:
   - Provide `WOOFSKIS_ADMIN_EMAIL`, `WOOFSKIS_ADMIN_PASSWORD`, and `WOOFSKIS_ADMIN_NAME` in environment.
   - Run the admin bootstrap script.

---

## 4. Graphify & Architecture Reference

- Complete architectural audit and module implementation map: `docs/knowledge/WOOFSKIS-ARCHITECTURE-REFERENCE.md`
- **Architecture Reference**: The files under `docs/graphify/` (`cos-project-graph.json`) define the Woofskis architecture graph, indexing all frontend components, backend services, database models, and API routes.
