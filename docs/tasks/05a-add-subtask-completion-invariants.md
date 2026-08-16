---
title: 05a — Add Subtask Completion Invariants
sidebar_position: 14
---

# Add Subtask Completion Invariants

OpenSpec change: `add-subtask-completion-invariants`

## Dependency position

Starts after [Add Task Write API](./04b-add-task-write-api.md).

## Outcome

Enforce the arbitrary-depth rule that no completed task may contain an incomplete descendant.

## Scope

- [ ] Add bounded ancestor and descendant queries with defensive cycle detection.
- [ ] Reject completing a task with any incomplete descendant as `SUBTASKS_INCOMPLETE`.
- [ ] Reject reopening a task below a completed ancestor and creating a child below a completed parent as `COMPLETED_ANCESTOR`.
- [ ] Keep unchanged status patches idempotent.
- [ ] Use a documented transaction isolation/locking strategy that makes concurrent writes safe.
- [ ] Test leaf-up completion, root-down reopening, three-level trees, child creation, and concurrency.

## Acceptance checks

- [ ] The invariant holds for every API write path at arbitrary depth.
- [ ] The flat `Task[]` contract remains unchanged.

## Unlocks

[Add Task Status UI](./06a-add-task-status-ui.md).
