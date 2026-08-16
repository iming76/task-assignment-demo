---
title: 01a — Add Backend Workspace
sidebar_position: 2
---

# Add Backend Workspace

OpenSpec change: `add-backend-workspace`

## Dependency position

Root change. Start this immediately, in parallel with the other `01` plans.

## Outcome

Create the minimum TypeScript backend workspace and Prisma client boundary without defining product tables or HTTP routes.

## Scope

- [ ] Add `apps/backend/package.json`, strict TypeScript configuration, source entry point, and Turborepo-compatible build, lint, and type-check scripts.
- [ ] Add Prisma and PostgreSQL dependencies plus generation and migration scripts.
- [ ] Add one reusable Prisma client entry point with clean shutdown behavior.
- [ ] Document the local `DATABASE_URL` contract in an example environment file without committing credentials.
- [ ] Add a smoke test proving the package compiles and Prisma Client can be generated.

## Acceptance checks

- [ ] Backend build, lint, and type-check commands run through pnpm filters.
- [ ] No product schema, seed data, HTTP routes, shared DTOs, or frontend behavior is introduced.

## Unlocks

[Add Relational Task Schema](./02a-add-relational-task-schema.md).
