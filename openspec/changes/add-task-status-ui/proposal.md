## Why

Task-tree users need reliable status controls and clear guidance when recursive invariants reject a transition.

## What Changes

- Add pending-safe status updates and actionable UI handling for incomplete descendants and completed ancestors.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `task-status-ui`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Frontend task tree status controls, public error mapping, and interaction tests.
