## Context

No application currently owns the public models, and both future applications must consume the same declarations. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- A runtime-light package with stable root exports and compile-time ownership tests.

**Non-Goals:**

- API request DTOs or application-specific view/persistence models.

## Decisions

1. Publish explicit package exports and declarations from @repo/shared-types. Source-path imports were rejected because they bypass package boundaries.
2. Represent identifiers as strings and relationships as flattened ID arrays in public models. Re-exporting Prisma types was rejected because it couples consumers to persistence.

## Risks / Trade-offs

- [Types can be copied into apps later] → add external compile fixtures and a static duplicate-declaration check in the API-contract slice.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
