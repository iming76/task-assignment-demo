---
title: 03b — Add Backend API Foundation
sidebar_position: 9
---

# Add Backend API Foundation

OpenSpec change: `add-backend-api-foundation`

## Dependency position

Starts after [Add Relational Task Schema](./02a-add-relational-task-schema.md) and [Add Shared API Contracts](./02b-add-shared-api-contracts.md).

## Outcome

Establish the Fastify service, dependency boundaries, runtime validation, and consistent public errors.

## Scope

- [ ] Add Fastify, application test tooling, and server scripts.
- [ ] Define routes with documented inputs, responses, and examples.
- [ ] Add production and test bootstraps with injectable dependencies.
- [ ] Define handler, application-service, repository, and transaction boundaries without implementing resource behavior.
- [ ] Import public DTOs from `@repo/shared-types` and add one mapper for all documented error codes.
- [ ] Prevent raw Prisma messages, stack traces, and internal details from reaching responses.

## Acceptance checks

- [ ] Fastify validates requests at the route boundary.
- [ ] A test server boots with fake repositories and returns the consistent error envelope.

## Unlocks

All wave `04` backend endpoint changes.
