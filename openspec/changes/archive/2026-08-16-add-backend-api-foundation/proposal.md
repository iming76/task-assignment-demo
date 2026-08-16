## Why

Resource endpoints need a contract-first server boundary before behavior can be implemented safely in parallel.

## What Changes

- Create the Fastify/OpenAPI bootstrap, dependency injection, handler/service/repository boundaries, and unified error mapping.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `backend-api-foundation`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Backend runtime and tests, OpenAPI files, shared DTO imports, and future endpoint slices.
