## Context

Resource read/write APIs and the typed client are available alongside the frontend shell. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Focused dashboard, developer, and skill workflows with safe destructive interaction.

**Non-Goals:**

- Skill update UI or task-tree behavior.

## Decisions

1. Keep route-level product compositions in apps/frontend while consuming @repo/ui primitives. Moving product forms into packages/ui was rejected.
2. Use a confirmation dialog and one pending mutation guard for every deletion. Immediate delete-on-click was rejected.

## Risks / Trade-offs

- [Lists can become stale after mutations] → refresh or update local data only after confirmed server success and surface IN_USE as authoritative.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
