## Context

packages/ui exists but is not yet the complete owned primitive system needed by the frontend. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- An accessible, themed primitive library with isolated documentation and checks.

**Non-Goals:**

- Product feature components or backend-connected stories.

## Decisions

1. Treat shadcn/ui output as repository-owned source exported through @repo/ui. Installing a black-box runtime component library was rejected because customization and ownership are requirements.
2. Run Storybook in packages/ui with mocked/local stories only. Application-integrated stories were rejected because the package must validate independently.

## Risks / Trade-offs

- [Generated primitives can drift] → keep exports, stories, and interaction/accessibility checks in the same change.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
