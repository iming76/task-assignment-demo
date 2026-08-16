## Context

The API foundation supports endpoint slices and the schema enforces references for developers and skills. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Transactional developer/skill mutation behavior and explicit IN_USE failures.

**Non-Goals:**

- Category mutations or frontend controls.

## Decisions

1. Replace complete skill sets transactionally after validating all IDs. Incremental, partially successful join updates were rejected.
2. Check in-use relationships at the application boundary and retain database restrictions as defense in depth. Blind cascading deletes were rejected.

## Risks / Trade-offs

- [Uniqueness races may reach the database] → translate known constraint failures into the public validation contract.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
