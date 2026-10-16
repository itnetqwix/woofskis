---
description: Backend development rules, Fastify 5 conventions, Prisma ORM patterns, and REST API standards
globs: backend/**/*.{ts,js,prisma,json}
alwaysApply: false
---

# 04 - Backend Development Rules (backend)

## 1. Backend Architecture Reference
Consult [docs/knowledge/backend-map.md](file:///D:/woofskis/docs/knowledge/backend-map.md), [docs/knowledge/api-map.md](file:///D:/woofskis/docs/knowledge/api-map.md), and [docs/knowledge/data-model.md](file:///D:/woofskis/docs/knowledge/data-model.md) when relevant; avoid rereading everything.

## 2. Fastify Route & Controller Standards
- Register all routes under `/api/v1` in `src/routes/index.ts` or domain route plugins.
- Every route MUST define a Swagger/OpenAPI schema in `src/schemas/<domain>.schema.ts` specifying `tags`, `summary`, `description`, `body`, `params`, `querystring`, and structured `response` models.
- Controllers in `src/controllers/` MUST only handle HTTP orchestration and use `src/utils/response.ts:sendSuccess` or `sendError`.

## 3. Zod Schema Validation
- Define Zod schemas for runtime payload validation.
- Fastify routes automatically validate request parameters against these schemas before controller execution.

## 4. Authentication & Authorization (RBAC)
- Protect private routes with `onRequest: [fastify.authenticate]`.
- Guard role-restricted routes with `onRequest: [fastify.authenticate, authorizeRoles('ADMIN')]`.
- Read authenticated user context from `request.user` (`{ id, email, role }`).

## 5. Database & Prisma Repository Pattern
- Never execute raw Prisma queries in Controllers or Route files.
- Place all data access logic in `src/repositories/<domain>.repository.ts`.
- Encapsulate transactions inside repositories when performing multi-table writes.
- When updating schema in `prisma/schema.prisma`, run `npx prisma generate` only if schema was changed and genuinely necessary.

## 6. Testing & Quality Checks
- Do not run builds, tests, linters, or extra verification unless explicitly requested or genuinely necessary.
