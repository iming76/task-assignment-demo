---
title: 04b — Add Task Write API
sidebar_position: 12
---

# Add Task Write API

OpenSpec change: `add-task-write-api`

## Dependency position

Starts after [Add Database Seeds](./03a-add-database-seeds.md) and [Add Backend API Foundation](./03b-add-backend-api-foundation.md).

## Outcome

Implement task create, patch, assignment validation, skill replacement, and safe deletion, deferring recursive status and LLM behavior.

## Scope

- [ ] Create unassigned `TODO` tasks with validated title, description, parent, and supplied skill IDs.
- [ ] Preserve omitted skills at the service boundary; temporarily fall back to `[]` until skill inference lands.
- [ ] Patch non-empty combinations of task fields and support explicit unassignment.
- [ ] Enforce exact/superset assignment eligibility and reject skill replacement that invalidates the current assignee.
- [ ] Delete tasks only when they have no children.
- [ ] Make multi-row validation and writes transactional and cover all success/error cases.

## Acceptance checks

- [ ] Direct HTTP calls cannot bypass skill matching.
- [ ] Recursive completion checks and provider calls are not introduced.

## Unlocks

[Add Subtask Completion Invariants](./05a-add-subtask-completion-invariants.md), [Add Task Skill Inference](./05b-add-task-skill-inference.md), task UI, and agent planning.
