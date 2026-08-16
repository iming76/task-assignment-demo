---
title: 06b — Add Agent Planning UI
sidebar_position: 20
---

# Add Agent Planning UI

OpenSpec change: `add-agent-planning-ui`

## Dependency position

Starts after [Add Task Tree UI](./05c-add-task-tree-ui.md) and [Add Agent Planning API](./05e-add-agent-planning-api.md).

## Outcome

Deliver the `/agent-task` conversational clarification-and-creation workflow.

## Scope

- [ ] Submit a bounded natural-language conversation only through the typed backend client.
- [ ] Preserve and render clarification turns until the backend creates the plan.
- [ ] Render persisted tasks and structured required-role warnings after creation.
- [ ] Show no-match assignees as unassigned without presenting successful creation as failed.
- [ ] Present a useful unavailable state when planning is not configured while leaving the rest of the app usable.
- [ ] Test repeated clarification, created tasks, staffing gaps, unavailable, and validation states.

## Acceptance checks

- [ ] No provider key or provider SDK is shipped to the browser.
- [ ] The browser never sends a second apply mutation or assigns developers locally.

## Unlocks

Final full-stack validation.
