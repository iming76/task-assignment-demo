## Context

Task writes already support parent links and status patches, but the completion rule spans arbitrary depth and concurrent writes. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Bounded hierarchy traversal and race-safe invariant checks on every relevant task write.

**Non-Goals:**

- Changing the flat response shape or implementing UI guidance.

## Decisions

1. Use recursive SQL or batched traversal behind repository methods, with visited-node cycle detection. One query per level was rejected for unbounded latency.
2. Run hierarchy checks and writes under a documented isolation/locking strategy. Best-effort preflight checks outside a transaction were rejected.

## Risks / Trade-offs

- [Locking may reduce concurrency for the same tree] → scope locks to affected ancestry/tree records and prove behavior with a concurrent test.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
