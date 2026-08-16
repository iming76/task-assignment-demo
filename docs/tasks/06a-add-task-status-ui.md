---
title: 06a — Add Task Status UI
sidebar_position: 19
---

# Add Task Status UI

OpenSpec change: `add-task-status-ui`

## Dependency position

Starts after [Add Subtask Completion Invariants](./05a-add-subtask-completion-invariants.md) and [Add Task Tree UI](./05c-add-task-tree-ui.md).

## Outcome

Add status transitions and actionable recursive-invariant feedback to the task tree.

## Scope

- [ ] Display canonical `TODO`/`DONE` values as “To-do” and “Done.”
- [ ] Submit status patches with accurate pending, success, and failure state.
- [ ] Explain `SUBTASKS_INCOMPLETE` with leaf-up completion guidance.
- [ ] Explain `COMPLETED_ANCESTOR` with root-down reopening guidance.
- [ ] Keep invariant authorization on the server rather than duplicating it in the UI.
- [ ] Test success, stale-state prevention, both conflict responses, and retry behavior.

## Acceptance checks

- [ ] Failed transitions never appear successful.
- [ ] Users receive enough guidance to resolve both recursive conflicts.

## Unlocks

Final full-stack validation.
