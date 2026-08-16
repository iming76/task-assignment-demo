## Context

The backend workspace supplies Prisma, while the architecture defines normalized tables and arbitrary-depth task links. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- A migration-backed schema with explicit joins, constraints, indexes, and safe references.
- Constant-time access to a task's hierarchy depth without imposing a maximum nesting tier.

**Non-Goals:**

- Seeds, API policies, or recursive completion behavior.

## Decisions

1. Use explicit DeveloperSkill and TaskSkill models instead of implicit many-to-many relations so database names, uniqueness, and indexes are auditable.
2. Use a nullable self-relation for task ancestry and restrictive reference behavior. Fixed-depth subtask tables and cascading destructive behavior were rejected.
3. Persist one-based task depth: roots default to `1`, and task creation stores the selected parent's depth plus one. The value is denormalized for efficient reads and does not limit nesting. Any future re-parenting operation must update the moved task and all descendants transactionally.

## Risks / Trade-offs

- [Restrictive deletes surface conflicts to callers] → later API changes map those conflicts to IN_USE rather than hiding them.
- [Persisted depth can drift from parent links] → task writes calculate depth server-side, and future re-parenting must update the complete moved subtree in one transaction.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
