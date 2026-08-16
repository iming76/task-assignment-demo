## Why

Omitted skills should be inferred automatically without allowing provider failures or untrusted output to block task creation.

## What Changes

- Add an injectable inference boundary, validated canonical output, omission-only triggering, timeout, safe fallback, and fake-provider tests.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `task-skill-inference`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Backend task creation, AI SDK/provider configuration, logs, environment examples, and tests.
