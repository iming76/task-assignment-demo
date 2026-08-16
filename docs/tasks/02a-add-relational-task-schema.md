---
title: 02a — Add Relational Task Schema
sidebar_position: 5
---

# Add Relational Task Schema

OpenSpec change: `add-relational-task-schema`

## Dependency position

Starts after [Add Backend Workspace](./01a-add-backend-workspace.md).

## Outcome

Define and migrate the normalized PostgreSQL schema for developers, categories, skills, tasks, and their relationships.

## Scope

- [ ] Add UUID-backed `Developer`, `Category`, `Skill`, and `Task` Prisma models.
- [ ] Add explicit `DeveloperSkill` and `TaskSkill` join models with composite uniqueness and foreign-key indexes.
- [ ] Enforce category-scoped skill-name uniqueness and required skill descriptions.
- [ ] Add nullable assignee and arbitrary-depth self-referencing `parentTaskId` relations with safe delete behavior.
- [ ] Persist one-based task depth, defaulting roots to `1` without imposing a maximum tier.
- [ ] Map documented snake_case database names and commit the initial migration.
- [ ] Test constraints, root tasks, one-based three-level nesting, and migration against an empty PostgreSQL database.

## Acceptance checks

- [ ] The schema matches the architecture data model and Prisma Client generation succeeds.
- [ ] No seed data, HTTP behavior, or transport types are introduced.

## Unlocks

[Add Database Seeds](./03a-add-database-seeds.md) and [Add Backend API Foundation](./03b-add-backend-api-foundation.md).
