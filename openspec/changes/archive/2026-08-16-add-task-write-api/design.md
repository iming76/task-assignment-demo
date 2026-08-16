## Context

The API foundation and schema are ready; recursive completion and provider inference are deliberately separate extensions. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Transactional task mutations with server-side assignment and deletion rules plus extension seams.

**Non-Goals:**

- Recursive status invariants or real inference calls.

## Decisions

1. Keep handlers thin and place validation plus writes in an injectable task service transaction. Handler-local Prisma logic was rejected.
2. Preserve whether requiredSkillIds was omitted, using an empty fallback until inference decorates creation. Collapsing omission to [] at validation time was rejected.

## Risks / Trade-offs

- [Concurrent related updates could invalidate assumptions] → perform multi-row reads and writes in one transaction and expose a transaction boundary for later invariants.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
