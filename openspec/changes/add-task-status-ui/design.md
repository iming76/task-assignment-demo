## Context

The recursive invariant API and task tree UI exist; this slice adds only status interaction and conflict recovery. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Accurate mutation state and clear leaf-up/root-down guidance.

**Non-Goals:**

- Reimplementing hierarchy authorization in the browser.

## Decisions

1. Send canonical status patches through the typed client and update displayed state only from successful responses. Optimistic permanent success was rejected.
2. Map the two public conflict codes to specific guidance while allowing the server to decide legality. Precomputing authorization from cached trees was rejected.

## Risks / Trade-offs

- [Concurrent server changes can make local guidance stale] → preserve server messages and make retry/refresh straightforward.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
