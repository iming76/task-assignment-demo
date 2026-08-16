## Context

The backend workspace supplies Prisma, while the architecture defines normalized tables and arbitrary-depth task links. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- A migration-backed schema with explicit joins, constraints, indexes, and safe references.

**Non-Goals:**

- Seeds, API policies, or recursive completion behavior.

## Decisions

1. Use explicit DeveloperSkill and TaskSkill models instead of implicit many-to-many relations so database names, uniqueness, and indexes are auditable.
2. Use a nullable self-relation for task ancestry and restrictive reference behavior. Fixed-depth subtask tables and cascading destructive behavior were rejected.

## Risks / Trade-offs

- [Restrictive deletes surface conflicts to callers] → later API changes map those conflicts to IN_USE rather than hiding them.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
