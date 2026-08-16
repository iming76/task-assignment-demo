## Why

Users need to view and manage flat API tasks as an arbitrary-depth hierarchy with safe assignment guidance.

## What Changes

- Add recursive tree construction/rendering, root/child creation, edits, skill correction, assignment filtering, and confirmed deletion.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `task-tree-ui`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Frontend task route, recursive components, typed API client, @repo/ui, and component tests.
