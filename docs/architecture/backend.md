---
title: Backend Architecture
sidebar_position: 2
---

# Backend Architecture

This page describes the implemented Node.js + TypeScript service in
`apps/backend`. See the numbered
[backend API foundation plan](../tasks/03b-add-backend-api-foundation.md) and
later resource/agent plans for the sequence it was built in.

## Stack

- **Framework:** Fastify
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Shared DTOs:** `packages/shared-types`
- **Testing:** Vitest and Fastify injection

## Layout

```text
apps/backend/
├── prisma/                    # Database schema, migrations, and seed data
├── scripts/                   # Standalone scripts (e.g. live agent-planning verification)
├── src/
│   ├── config/                # Environment parsing and runtime configuration
│   ├── routes/                # HTTP handlers and schemas grouped by API resource
│   │   ├── tasks/
│   │   ├── developers/
│   │   ├── categories/
│   │   ├── skills/
│   │   ├── agent-task/
│   │   └── health/
│   ├── services/               # Business rules and use-case orchestration
│   ├── lib/                    # Infrastructure used by application services
│   │   ├── repositories/       # Prisma queries and persistence mapping
│   │   ├── skill-inference/    # Provider-neutral required-skill inference adapter
│   │   ├── agent-orchestration/ # Provider-neutral agent task-planning adapter
│   │   ├── prisma.ts           # Prisma client wiring
│   │   ├── prisma-error.ts     # Prisma error translation
│   │   └── transaction.ts      # Transactional helper for multi-write services
│   ├── errors/                 # Application errors and HTTP error mapping
│   ├── app.ts                  # Testable Fastify application factory
│   └── server.ts               # Process entrypoint
├── test/                       # Tests organized in parallel with src
├── package.json
└── Dockerfile
```

Route folders use the TypeScript DTOs from `packages/shared-types` rather than
defining competing request or response shapes.

## Responsibilities

- `config/` owns runtime configuration parsed from environment variables.
- `routes/` translates validated HTTP input into service calls and maps service
  results to documented responses. Handlers do not query Prisma directly.
- `services/` owns task creation, assignment eligibility, status transitions,
  skill inference invocation, and agent-task orchestration. It is independent
  of Fastify request objects.
- `lib/repositories/` owns database access through Prisma.
- `lib/skill-inference/` isolates the LLM provider integration used for
  automatic required-skill inference.
- `lib/agent-orchestration/` isolates the LLM provider integration used for
  conversational task planning.
- `lib/` otherwise contains infrastructure only; unrelated helpers and
  business rules do not belong there.
- `errors/` defines application errors and one safe mapping to the public
  error envelope.

`app.ts` is the composition root: it creates the Fastify instance, registers
routes, and injects repositories and adapters. `server.ts` only loads runtime
configuration and starts listening.

## Request Flow

1. Fastify validates an incoming request against its route's JSON Schema.
2. A route handler converts the validated input into a service call.
3. The service enforces domain rules and coordinates repositories or the
   skill-inference/agent-orchestration adapters through injected interfaces.
4. A repository performs the database work and returns shared domain shapes.
5. The handler returns the documented response, while the central error mapper
   converts known failures into the public error envelope.

## Key Rules

- `packages/shared-types` provides the HTTP DTOs used by both applications.
- The service layer enforces assignment eligibility and recursive task status
  rules; related writes are transactional (`lib/transaction.ts`).
- Skill inference runs only when required skills are omitted on `POST /tasks`,
  validates results against stored skills, and falls back to an untagged task
  when unavailable or invalid.
- Agent task planning (`POST /agent-task`) reloads the current skill catalog,
  revalidates every generated skill ID, and creates the full task tree in one
  transaction; an invalid plan or persistence failure rolls back completely.
- Errors use one public response shape and do not expose internal details.

## Testing

Vitest covers service rules and Fastify routes; repository and route tests run
against a real PostgreSQL instance (see `test/`). LLM provider calls are faked
in automated tests. `pnpm --filter backend verify:agent-planning` exercises
the live OpenAI provider separately and is not part of the automated suite.

## Related Documents

See [Data Model](./data-model.md) for the
`Developer`/`Category`/`Skill`/`Task` schema,
[Backend API Contract](../contract/backend-api.md) for request and response details,
[Architecture Principles](../constitution/architecture.md) for governing rules,
and [Tasks](../tasks/overview.md) for implementation sequencing.
