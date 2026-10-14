# Legacy Migrations Archive (M05–M13)

These 15 migrations represent the historical incremental evolution of the multi-tenant Ripskis contest operating system before the single-product Woofskis deployment baseline.

### Why they are archived
- Historical migrations began at M05 (`20260924180000_m05_contest_lifecycle`) and assumed pre-existing multi-tenant `organizations` and `users` tables from older untracked M01–M04 migrations.
- When run on a clean database, `20260924180000_m05_contest_lifecycle` failed due to foreign key references to nonexistent `organizations`.
- In `20260929140000_single_product_ripskis`, organization tenancy was subsequently dropped and roles consolidated into `ADMIN` and `CREATOR`.
- Woofskis is an independent, single-product deployment (`woofskis.com`) without organization tenancy.

### Baseline
- The active, consolidated Woofskis baseline is maintained under `prisma/migrations/20261013180000_woofskis_baseline/migration.sql`.
- It incorporates all canonical models, enums, indexes, foreign keys, CHECK constraints, and PL/pgSQL triggers.
