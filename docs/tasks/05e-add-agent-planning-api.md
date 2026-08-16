---
title: 05e — Add Agent Planning API
sidebar_position: 18
---

# Add Agent Planning API

OpenSpec change: `add-agent-planning-api`

## Dependency position

Starts after [Add Resource Read API](./04a-add-resource-read-api.md) and [Add Task Write API](./04b-add-task-write-api.md).

## Outcome

Generate reviewable recursive task drafts without writes and atomically apply reviewed drafts after fresh validation.

## Scope

- [ ] Add typed proposal/apply endpoints and an injectable planning-service boundary.
- [ ] Generate structured recursive drafts using current skills and developers; reject unknown IDs and clear ineligible generated assignees.
- [ ] Keep proposal generation write-free and map configuration/provider failures to safe `AGENT_UNAVAILABLE` responses.
- [ ] Revalidate every edited ID and assignment during apply without calling the provider.
- [ ] Flatten and create the complete `TODO` tree transactionally, rolling back on any failure.
- [ ] Apply timeout, request/output-size, traversal, and sanitized logging protections.
- [ ] Test multi-root three-level plans, no-write generation, unavailable behavior, edits, stale IDs, mismatch, and rollback with fakes.

## Acceptance checks

- [ ] Generation never persists and apply never trusts generated or client-edited identifiers.
- [ ] Deterministic apply remains available without an LLM key.

## Unlocks

[Add Agent Planning UI](./06b-add-agent-planning-ui.md).
