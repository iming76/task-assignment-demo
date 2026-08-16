---
title: 05c — Add Task Tree UI
sidebar_position: 16
---

# Add Task Tree UI

OpenSpec change: `add-task-tree-ui`

## Dependency position

Starts after [Add Frontend API Client](./03c-add-frontend-api-client.md), [Add Resource Read API](./04a-add-resource-read-api.md), and [Add Task Write API](./04b-add-task-write-api.md).

## Outcome

Deliver recursive task browsing, creation, editing, assignment, skill correction, and deletion.

## Scope

- [ ] Build a cycle-safe tree from the flat task response and visibly retain orphaned tasks.
- [ ] Render arbitrary depth with one recursive component and stable keys.
- [ ] Create roots and children, preserving omission versus explicit `[]` and sending the correct `parentTaskId`.
- [ ] Filter assignees by full skill coverage while treating server validation as authoritative.
- [ ] Support title/description/skill/assignee edits and recover visibly untagged tasks.
- [ ] Confirm task deletion, prevent duplicate submission, and explain `IN_USE` and `SKILL_MISMATCH` failures.
- [ ] Test loading, empty, error, three-level nesting, grandchild creation, correction, and mutation states.

## Acceptance checks

- [ ] UI-specific tree state does not redeclare public transport types.
- [ ] Assignment controls never present partial skill matches as eligible.

## Unlocks

[Add Task Status UI](./06a-add-task-status-ui.md) and [Add Agent Planning UI](./06b-add-agent-planning-ui.md).
