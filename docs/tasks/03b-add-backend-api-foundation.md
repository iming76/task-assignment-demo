---
title: 03b — Add Backend API Foundation
sidebar_position: 9
---

# Add Backend API Foundation

OpenSpec change: `add-backend-api-foundation`

## Dependency position

Starts after [Add Relational Task Schema](./02a-add-relational-task-schema.md) and [Add Shared API Contracts](./02b-add-shared-api-contracts.md).

## Outcome

Establish the contract-first Fastify service, dependency boundaries, runtime validation, and consistent public errors.

## Scope

- [ ] Add Fastify, `fastify-openapi-glue`, application test tooling, and server scripts.
- [ ] Create the split OpenAPI contract with documented operations, schemas, IDs, responses, and examples.
- [ ] Add production and test bootstraps with injectable dependencies.
- [ ] Define handler, application-service, repository, and transaction boundaries without implementing resource behavior.
- [ ] Import public DTOs from `@repo/shared-types` and add one mapper for all documented error codes.
- [ ] Prevent raw Prisma messages, stack traces, and internal details from reaching responses.

## Acceptance checks

- [ ] OpenAPI drives routing and validation.
- [ ] A test server boots with fake repositories and returns the consistent error envelope.

## Unlocks

All wave `04` backend endpoint changes.
