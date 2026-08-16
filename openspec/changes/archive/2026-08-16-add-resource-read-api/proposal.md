## Why

The UI and planning services need stable reads of tasks, developers, skills, and categories.

## What Changes

- Implement flattened repositories plus deterministic list/detail endpoints and not-found handling.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `resource-read-api`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Backend repositories, handlers, OpenAPI operations, PostgreSQL integration tests, and frontend consumers.
