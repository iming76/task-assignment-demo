## Context

Both application images exist and the database seed is idempotent; orchestration must work without host tooling. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Health-ordered database initialization and application startup with persistent data.

**Non-Goals:**

- Managed infrastructure, production secrets, or cloud networking.

## Decisions

1. Model db, backend, and frontend as separate services with health-based dependency conditions. Timing-only sleeps were rejected.
2. Run committed migrations and application seed before the long-running backend starts, preserving a named database volume. Baking database state into images was rejected.

## Risks / Trade-offs

- [Compose dependency conditions do not replace runtime resilience] → keep clear startup failure messages and service health checks.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
