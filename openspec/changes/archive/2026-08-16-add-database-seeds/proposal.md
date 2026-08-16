## Why

Development and integration tests need deterministic representative data without mixing application and test identities.

## What Changes

- Add idempotent application seeds, guarded test fixtures, stable disjoint UUIDs, and repeatability tests.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `database-seeds`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Backend seed scripts, Prisma data, local/Compose initialization, and integration fixtures.
