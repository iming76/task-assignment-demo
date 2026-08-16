## Why

Task status writes can otherwise create logically inconsistent trees at arbitrary depth.

## What Changes

- Add hierarchy queries and race-safe completion, reopening, and child-creation invariants with public conflict errors.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `subtask-completion-invariants`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Backend task service/repository transactions and arbitrary-depth/concurrency tests.
