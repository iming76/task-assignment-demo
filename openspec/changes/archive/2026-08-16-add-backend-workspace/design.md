## Context

The repository has workspace tooling but no backend application. This slice must establish package and database-client seams without claiming product behavior. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- A backend package that participates in root tasks and exposes one database-client boundary.

**Non-Goals:**

- Schema design, seed data, or HTTP routes.

## Decisions

1. Use a dedicated apps/backend package with strict TypeScript and the existing pnpm/Turborepo conventions. A loose collection of root scripts was rejected because it would not give later changes an independently buildable unit.
2. Centralize Prisma Client construction and lifecycle in one module, configured only through DATABASE_URL. Creating clients inside repositories was rejected because it complicates tests and shutdown.

## Risks / Trade-offs

- [Prisma generation requires a database-oriented toolchain] → pin dependencies and cover generation with a smoke check.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
