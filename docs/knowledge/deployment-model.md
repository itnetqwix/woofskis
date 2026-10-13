# Single-product Woofskis

Each deployment is one product. This repository is the Woofskis deployment. There is no customer-facing organization, brand, or tenant.

Roles in the database are `ADMIN` and `CREATOR`. A guest is an unauthenticated visitor and is not a user row.

- **Admin** is provisioned with `scripts/bootstrap-woofskis.ts` and `WOOFSKIS_ADMIN_EMAIL`, `WOOFSKIS_ADMIN_PASSWORD`, `WOOFSKIS_ADMIN_NAME`. There is no admin signup.
- **Creator** self-registers with name, email, and password. The client does not send an organization.
- **Guest** uses public judging, rating, the score reveal, and the leaderboard without a token.

JWT claims are `id`, `email`, and `role`.

`GET /api/v1/contests/active` is public and returns every `ACTIVE` contest. Contest, category, submission, moderation, rating, and leaderboard rows are not organization-scoped.

Storage is private S3. New object keys are `contests/{contestId}/creators/{creatorId}/{uuid}.{ext}`. Older `org/...` keys still parse so an existing object can be played back.

Historical multi-tenant chapters under `docs/source` and `docs/COS-MASTER-IMPLEMENTATION-PLAN.md` are not the running product.
