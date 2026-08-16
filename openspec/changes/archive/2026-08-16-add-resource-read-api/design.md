## Context

The backend foundation exposes repository and handler seams and seeded PostgreSQL provides representative records. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Deterministic public list/detail reads with flattened relationships.

**Non-Goals:**

- Writes, pagination, search, or nested task responses.

## Decisions

1. Flatten join tables in repositories so application/transport layers receive public shapes. Returning Prisma relation objects was rejected.
2. Keep GET /tasks flat and order every collection deterministically. Server-built nested trees were rejected because the contract assigns tree construction to the frontend.

## Risks / Trade-offs

- [Large unpaginated lists do not scale indefinitely] → accept this assignment-sized trade-off and keep pagination out of scope.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
