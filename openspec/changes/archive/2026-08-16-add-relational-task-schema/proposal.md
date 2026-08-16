## Why

The product cannot persist assignments or arbitrary task hierarchies until its normalized PostgreSQL model exists.

## What Changes

- Add Prisma models, join tables, self-referencing tasks with persisted hierarchy depth, constraints, indexes, delete behavior, and the initial migration.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `relational-task-schema`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Backend Prisma schema and migrations; requires the backend workspace.
