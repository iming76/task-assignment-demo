---
title: 04c — Add Resource Write API
sidebar_position: 13
---

# Add Resource Write API

OpenSpec change: `add-resource-write-api`

## Dependency position

Starts after [Add Database Seeds](./03a-add-database-seeds.md) and [Add Backend API Foundation](./03b-add-backend-api-foundation.md).

## Outcome

Implement developer and skill mutations with referential validation and safe deletion.

## Scope

- [ ] Create and patch developers with complete skill-set validation and replacement.
- [ ] Create and patch skills with required description, category validation, and category-scoped uniqueness.
- [ ] Delete developers only when unassigned and skills only when no developer or task references them.
- [ ] Return consistent `VALIDATION_ERROR`, `NOT_FOUND`, and `IN_USE` responses.
- [ ] Cover successful mutations, bad IDs, duplicate names, and every in-use relationship with integration tests.

## Acceptance checks

- [ ] Every multi-row mutation is transactional.
- [ ] Direct HTTP calls cannot bypass referential rules.

## Unlocks

[Add Resource Management UI](./05d-add-resource-management-ui.md).
