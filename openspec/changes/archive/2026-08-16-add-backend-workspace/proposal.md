## Why

The repository has no runnable backend package, so persistence and API work lack a stable TypeScript and Prisma foundation.

## What Changes

- Create a buildable backend workspace, reusable Prisma client boundary, database configuration contract, and generation smoke coverage.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `backend-workspace`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

apps/backend, root workspace scripts, Prisma/PostgreSQL dependencies, and local environment documentation.
