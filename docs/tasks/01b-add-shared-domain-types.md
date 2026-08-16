---
title: 01b — Add Shared Domain Types
sidebar_position: 3
---

# Add Shared Domain Types

OpenSpec change: `add-shared-domain-types`

## Dependency position

Root change. Start this immediately, in parallel with the other `01` plans.

## Outcome

Create `@repo/shared-types` and define framework-independent public domain models.

## Scope

- [ ] Add the package manifest, strict TypeScript configuration, source entry point, explicit exports, and build/lint/type-check scripts.
- [ ] Define `TaskStatus` as `"TODO" | "DONE"`.
- [ ] Define `Task`, `Developer`, `Category`, and `Skill` with string IDs, flattened skill-ID arrays, nullable assignment, and nullable parent task IDs.
- [ ] Keep the package free of Fastify, React, Prisma, and provider-specific dependencies.
- [ ] Add type-level tests and an external consumer compile fixture.

## Acceptance checks

- [ ] Consumers can import every domain type from `@repo/shared-types` without reaching into `src`.
- [ ] Invalid statuses and malformed domain objects fail type checking.

## Unlocks

[Add Shared API Contracts](./02b-add-shared-api-contracts.md).
