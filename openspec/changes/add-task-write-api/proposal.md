## Why

Core task creation and assignment must be enforced server-side before recursive and AI extensions can build on it.

## What Changes

- Implement transactional task create, patch, assignment/skill rules, and safe deletion while preserving deferred extension seams.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `task-write-api`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Backend task handlers, services, repositories, OpenAPI behavior, and task integration tests.
