## Why

Applications need a single transport contract so optional fields, recursive drafts, and errors cannot drift.

## What Changes

- Add resource DTOs, recursive proposal/apply DTOs, error contracts, compile fixtures, and an architecture ownership check.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `shared-api-contracts`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

@repo/shared-types, API consumers, architecture checks, and the future OpenAPI contract.
