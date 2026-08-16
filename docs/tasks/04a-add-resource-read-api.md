---
title: 04a — Add Resource Read API
sidebar_position: 11
---

# Add Resource Read API

OpenSpec change: `add-resource-read-api`

## Dependency position

Starts after [Add Database Seeds](./03a-add-database-seeds.md) and [Add Backend API Foundation](./03b-add-backend-api-foundation.md).

## Outcome

Implement deterministic task, developer, skill, and category list/detail reads.

## Scope

- [ ] Implement repositories that flatten join rows into `skillIds` and `requiredSkillIds`.
- [ ] Implement task list/detail endpoints, keeping list responses flat with `parentTaskId`.
- [ ] Implement developer, skill, and category list/detail endpoints.
- [ ] Apply documented stable ordering and `NOT_FOUND` behavior.
- [ ] Add OpenAPI/handler integration tests for every success and error response.

## Acceptance checks

- [ ] Runtime responses conform to OpenAPI and shared types.
- [ ] Reads expose no Prisma-specific shapes and perform no writes.

## Unlocks

Resource and task frontend features plus agent planning context reads.
