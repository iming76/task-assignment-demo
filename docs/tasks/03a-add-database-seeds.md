---
title: 03a — Add Database Seeds
sidebar_position: 8
---

# Add Database Seeds

OpenSpec change: `add-database-seeds`

## Dependency position

Starts after [Add Relational Task Schema](./02a-add-relational-task-schema.md).

## Outcome

Provide repeatable application seed data and isolated test fixtures with non-overlapping stable IDs.

## Scope

- [ ] Define stable application seed UUIDs in one named module.
- [ ] Seed Frontend/Backend categories, described skills, and developers representing exact-match, superset, and missing-skill cases.
- [ ] Make normal seeding idempotent with stable relationships.
- [ ] Define separate test-only fixture UUIDs and guard the fixture loader against non-test databases.
- [ ] Test exact seeded relationships, second-run stability, and disjoint application/test UUID sets.

## Acceptance checks

- [ ] Fresh and already-seeded databases reach the same application state.
- [ ] Normal seeding never loads test fixture IDs.

## Unlocks

API integration work in wave `04` and final Compose startup.
