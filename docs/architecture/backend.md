---
title: Backend Architecture
sidebar_position: 2
---

# Backend Architecture

This page describes the target design for the planned Node.js + TypeScript
service in `apps/backend`. The backend has not been scaffolded yet; the
numbered [backend API foundation plan](../tasks/03b-add-backend-api-foundation.md) owns its implementation
sequence.

## Stack

- **Framework:** Fastify
- **Contract:** OpenAPI
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Shared DTOs:** `packages/shared-types`
- **Testing:** Vitest and Fastify injection

## Target Layout

The structure follows common Fastify conventions while keeping the API
contract and persistence schema visible at the application root:

```text
apps/backend/
├── config/                    # Environment parsing and runtime configuration
├── openapi/                   # Routes, schemas, and operation IDs
├── prisma/                    # Database schema, migrations, and seed data
├── src/
│   ├── plugins/               # Shared Fastify integrations such as Prisma
│   ├── routes/                # HTTP handlers grouped by API resource
│   │   ├── tasks/
│   │   ├── developers/
│   │   ├── categories/
│   │   └── skills/
│   ├── services/              # Business rules and use-case orchestration
│   ├── lib/                   # Infrastructure used by application services
│   │   ├── repositories/      # Prisma queries and persistence mapping
│   │   └── skill-inference/   # Provider-neutral inference adapter
│   ├── errors/                # Application errors and HTTP error mapping
│   ├── app.ts                 # Testable Fastify application factory
│   └── server.ts              # Process entrypoint
├── test/                      # Tests organized in parallel with src
├── package.json
└── Dockerfile
```

Exact filenames may evolve during implementation. The directory boundaries and
dependency direction should remain stable. In particular, route folders do not
define competing request or response schemas: OpenAPI owns transport shapes,
and `packages/shared-types` owns the TypeScript DTOs used across applications.

## Responsibilities

- `config/` owns runtime configuration.
- `plugins/` registers shared infrastructure with Fastify. Plugins provide
  dependencies; they do not contain domain rules.
- `routes/` translates validated HTTP input into service calls and maps service
  results to documented responses. Handlers do not query Prisma directly.
- `services/` owns task creation, assignment eligibility, status transitions,
  and recursive subtask rules. It is independent of Fastify request objects.
- `lib/repositories/` owns database access through Prisma.
- `lib/skill-inference/` isolates the LLM provider integration.
- `lib/` contains infrastructure only; unrelated helpers and business rules do
  not belong there.
- `errors/` defines application errors and one safe mapping to the public error
  envelope.

`app.ts` is the composition root: it creates the Fastify instance, registers
plugins and routes, and injects repositories and adapters. `server.ts` only
loads runtime configuration and starts listening.

## Request Flow

1. Fastify validates an incoming request against OpenAPI.
2. A route handler converts the validated input into a service call.
3. The service enforces domain rules and coordinates repositories or skill
   inference through injected interfaces.
4. A repository performs the database work and returns shared domain shapes.
5. The handler returns the documented response, while the central error mapper
   converts known failures into the public error envelope.

## Key Rules

- OpenAPI defines the HTTP contract, while `packages/shared-types` provides the
  DTOs used by both applications.
- The service layer enforces assignment eligibility and recursive task status
  rules; related writes are transactional.
- Skill inference runs only when required skills are omitted, validates results
  against stored skills, and falls back safely when unavailable.
- Errors use one public response shape and do not expose internal details.

## Testing

Vitest covers service rules and Fastify routes, while repository integration
tests run against PostgreSQL. LLM provider calls are mocked in automated tests.

## Related Documents

See [Data Model](./data-model.md) for the
`Developer`/`Category`/`Skill`/`Task` schema,
[Backend API Contract](../contract/backend-api.md) for request and response details,
[Architecture Principles](../constitution/architecture.md) for governing rules,
and [Tasks](../tasks/overview.md) for implementation sequencing.
