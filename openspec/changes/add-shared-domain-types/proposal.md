## Why

Backend and frontend work need one framework-independent vocabulary before either application defines competing models.

## What Changes

- Create the @repo/shared-types package with canonical domain models, exports, and type-level consumer checks.
- Keep this change independently reviewable and limited to its numbered task-plan boundary.

## Capabilities

### New Capabilities

- `shared-domain-types`: Defines the observable requirements and acceptance behavior for this change.

### Modified Capabilities

- None.

## Impact

packages/shared-types, Turborepo package ordering, and future backend/frontend imports.
