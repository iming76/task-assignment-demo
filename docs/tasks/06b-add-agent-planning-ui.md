---
title: 06b — Add Agent Planning UI
sidebar_position: 20
---

# Add Agent Planning UI

OpenSpec change: `add-agent-planning-ui`

## Dependency position

Starts after [Add Task Tree UI](./05c-add-task-tree-ui.md) and [Add Agent Planning API](./05e-add-agent-planning-api.md).

## Outcome

Deliver the `/agent-task` generate-review-edit-apply workflow with an explicit discard path.

## Scope

- [ ] Accept a natural-language description and request a proposal only through the typed backend client.
- [ ] Render and edit recursive draft names, descriptions, skills, assignees, and subtasks before persistence.
- [ ] Require an explicit apply or discard decision; generation alone must not alter the task list.
- [ ] Show ineligible/no-match assignees as unassigned and surface apply-time validation errors.
- [ ] Present a useful unavailable state when planning is not configured while leaving the rest of the app usable.
- [ ] Test generation, three-level preview, edits, discard, apply, unavailable, mismatch, and no-eligible-developer states.

## Acceptance checks

- [ ] No provider key or provider SDK is shipped to the browser.
- [ ] The user always reviews the complete draft before apply.

## Unlocks

Final full-stack validation.
