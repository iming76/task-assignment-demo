## Why

The two applications need reproducible minimal images that do not ship the full monorepo or development tooling.

## What Changes

- Add Turborepo-pruned multi-stage backend/frontend images, non-root runtime, nginx SPA routing, and health checks.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `pruned-container-images`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Root Docker ignore rules, app Dockerfiles, production build scripts, and image verification.
