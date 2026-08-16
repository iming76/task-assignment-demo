## Why

Developer and skill management needs server-side referential validation and safe deletion.

## What Changes

- Implement transactional developer and skill mutations with validation, uniqueness, and in-use protection.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `resource-write-api`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Backend resource handlers, services, repositories, OpenAPI behavior, and integration tests.
