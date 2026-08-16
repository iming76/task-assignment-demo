---
title: 02b — Add Shared API Contracts
sidebar_position: 6
---

# Add Shared API Contracts

OpenSpec change: `add-shared-api-contracts`

## Dependency position

Starts after [Add Shared Domain Types](./01b-add-shared-domain-types.md).

## Outcome

Add canonical resource, conversational agent-task, and public error DTOs to `@repo/shared-types`.

## Scope

- [ ] Define create and patch task inputs, preserving omitted `requiredSkillIds` versus explicit `[]`.
- [ ] Define developer, skill, category, and task endpoint response types.
- [ ] Define agent conversation, clarification, created-task, and staffing-gap DTOs.
- [ ] Define the consistent error envelope and all documented error codes.
- [ ] Add compile fixtures for valid payloads and rejected invalid shapes.
- [ ] Add an architecture check that prevents application code from redeclaring public contracts.

## Acceptance checks

- [ ] Agent outcome discrimination and omission semantics survive consumer compilation.
- [ ] The package remains framework-, ORM-, and provider-independent.

## Unlocks

[Add Backend API Foundation](./03b-add-backend-api-foundation.md) and [Add Frontend API Client](./03c-add-frontend-api-client.md).
