## Context

Schema and shared DTOs exist, but endpoint slices need a common contract-first server and error boundary. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Injectable Fastify bootstrap, native Fastify routing validated against hand-authored JSON Schemas, layered seams, and safe public errors.

**Non-Goals:**

- Resource-specific read or mutation behavior.

## Decisions

1. Author each resource's request/response JSON Schemas directly in its own `src/routes/<resource>/schema.ts`, and register native Fastify routes by hand in a sibling `src/routes/<resource>/routes.ts`, following the target layout in [docs/architecture/backend.md](../../../../docs/architecture/backend.md) (`routes/<resource>/`, `app.ts` as the composition root). There is no assembled OpenAPI document: a runtime auto-router (`fastify-openapi-glue`) was rejected first for its `serviceHandlers`-by-operationId model and schema-authoring friction, and a shared, centrally-assembled OpenAPI document was rejected next as an unnecessary indirection once nothing serves it over HTTP — each route imports its own schema objects instead. A resource whose schema is needed elsewhere (e.g. `AgentTaskApplyResponse` embeds `Task`) imports it directly from that resource's `schema.ts`. `AgentTaskDraft` is genuinely recursive (subtasks nest the same shape), so it registers under its own `$id` via `app.addSchema` and is referenced by `$ref` rather than inlined. Independently maintained handler schemas were still rejected because they can drift from the shared DTOs.
2. Inject services/repositories into a bootstrap usable by production and tests, and map application errors once at transport. Prisma queries inside handlers were rejected.

## Risks / Trade-offs

- [OpenAPI and TypeScript declarations can diverge] → add contract tests and import shared DTOs at service/handler boundaries.
- [A resource's schema could drift from another route that also needs it] → cross-resource reuse (e.g. `AgentTaskApplyResponse` needing `Task`) imports the defining resource's schema object directly, so there is one physical source instead of two hand-synced copies.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
