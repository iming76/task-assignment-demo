## Context

Schema and shared DTOs exist, but endpoint slices need a common contract-first server and error boundary. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Injectable Fastify bootstrap, OpenAPI validation/routing, layered seams, and safe public errors.

**Non-Goals:**

- Resource-specific read or mutation behavior.

## Decisions

1. Use OpenAPI as the runtime routing and validation source through fastify-openapi-glue. Independently maintained handler schemas were rejected because they can drift.
2. Inject services/repositories into a bootstrap usable by production and tests, and map application errors once at transport. Prisma queries inside handlers were rejected.

## Risks / Trade-offs

- [OpenAPI and TypeScript declarations can diverge] → add contract tests and import shared DTOs at service/handler boundaries.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
