---
title: 05e — Add Agent Planning API
sidebar_position: 18
---

# Add Agent Planning API

OpenSpec change: `add-agent-planning-api`

## Dependency position

Starts after [Add Resource Read API](./04a-add-resource-read-api.md) and [Add Task Write API](./04b-add-task-write-api.md).

## Outcome

Clarify incomplete requests or atomically create a catalog-grounded recursive task tree after fresh validation.

## Scope

- [ ] Add one typed conversational endpoint and an injectable orchestration-provider boundary.
- [ ] Load the complete current skill list with names and descriptions before generating a structured recursive decision.
- [ ] Return clarification without writes and map configuration/provider failures to safe `AGENT_UNAVAILABLE` responses.
- [ ] Revalidate every selected skill ID and derive assignment from exact coverage plus active workload.
- [ ] Flatten and create the complete `TODO` tree transactionally, leaving no-match nodes unassigned and reporting staffing gaps.
- [ ] Apply timeout, request/output-size, traversal, and sanitized logging protections.
- [ ] Test multi-root plans, clarification, unavailable behavior, stale IDs, workload assignment, staffing gaps, and rollback with fakes.

## Acceptance checks

- [ ] Clarification never persists and creation never trusts generated identifiers.
- [ ] No-match staffing does not block otherwise valid creation.

## Unlocks

[Add Agent Planning UI](./06b-add-agent-planning-ui.md).
