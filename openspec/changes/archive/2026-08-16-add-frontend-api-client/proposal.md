## Why

Frontend features need one typed and testable network boundary instead of route-specific fetch logic.

## What Changes

- Add a typed resource and agent API client, environment-based base URL, omission-safe serialization, and error mapping.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `frontend-api-client`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Frontend data access, Vite environment configuration, shared DTO imports, and mocked HTTP tests.
