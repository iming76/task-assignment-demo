## Why

Natural-language plans must be reviewable and revalidated instead of being persisted directly from provider output.

## What Changes

- Add proposal and deterministic apply endpoints, structured recursive validation, eligibility checks, atomic tree creation, and safe provider failures.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `agent-planning-api`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

Backend OpenAPI, planning service/provider adapter, task transactions, shared agent DTOs, and tests.
