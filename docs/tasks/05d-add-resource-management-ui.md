---
title: 05d — Add Resource Management UI
sidebar_position: 17
---

# Add Resource Management UI

OpenSpec change: `add-resource-management-ui`

## Dependency position

Starts after [Add Frontend API Client](./03c-add-frontend-api-client.md), [Add Resource Read API](./04a-add-resource-read-api.md), and [Add Resource Write API](./04c-add-resource-write-api.md).

## Outcome

Deliver the dashboard plus developer and skill management routes.

## Scope

- [ ] Build a dashboard with task data and independent first-task/first-developer empty-state actions.
- [ ] Add developer create, read, update, and confirmed delete controls.
- [ ] Add skill create, read, and confirmed delete controls; do not expose skill updates.
- [ ] Load category choices from the API and require category and description for new skills.
- [ ] Prevent duplicate deletes and explain each `IN_USE` relationship returned by the server.
- [ ] Test loading, empty, success, error, cancel, pending, and delete-result states.

## Acceptance checks

- [ ] All route compositions use `@repo/ui` primitives and shared API types.
- [ ] No client-only validation is treated as authoritative.

## Unlocks

Final full-stack validation.
