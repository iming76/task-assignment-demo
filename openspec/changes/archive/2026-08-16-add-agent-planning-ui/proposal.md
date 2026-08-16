## Why

Users need an explicit generate-review-edit-apply experience before agent-proposed work becomes persistent.

## What Changes

- Add recursive draft preview/editing, explicit apply/discard, unavailable handling, and assignment feedback.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `agent-planning-ui`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Frontend agent-task route, typed planning client, task tree compositions, and component tests.
