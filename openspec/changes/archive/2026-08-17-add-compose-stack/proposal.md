## Why

A clean clone must start the database and both applications without host-side package installation or manual initialization.

## What Changes

- Add the PostgreSQL/backend/frontend Compose stack with health ordering, automatic migrations/seeding, persistence, and optional AI configuration.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `compose-stack`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Root Compose configuration, container commands, environment variables, volumes, health checks, and startup validation.
