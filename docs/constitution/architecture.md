---
title: Architecture Principles
sidebar_position: 1
---

# Architecture Principles

The architectural rules that recur across [Architecture Overview](../architecture/overview.md) and [Tasks](../tasks/overview.md), made explicit here so they're easy to point to instead of re-deriving from context.

## `shared-types` is the single source of truth

`Task`, `Developer`, `Category`, `Skill`, and every request/response DTO will be
defined once in `packages/shared-types` and imported by both apps when that
package is implemented. Neither app may redeclare an interface that exists
there, even when it would be more convenient in the moment — that's exactly the
drift a monorepo is supposed to prevent. See
[Data Model](../architecture/data-model.md).

## Business rules are enforced server-side, never trusted from the frontend

The assignment rule (developer's skills must cover the task's required skills) and completion invariant are checked in the backend on every relevant write. A task cannot become `"DONE"` with an incomplete descendant, an incomplete child cannot be added beneath a completed task, and a descendant cannot be reopened while an ancestor remains completed. The frontend may also filter or disable controls, but that is a convenience layer; a request that skips the UI must still be rejected. See [Add Task Write API](../tasks/04b-add-task-write-api.md) and [Add Subtask Completion Invariants](../tasks/05a-add-subtask-completion-invariants.md).

## Shared API contracts

Request and response DTOs in `packages/shared-types` are the source of truth for
the shapes exchanged by the frontend and backend. Handlers validate input at
the server boundary and implement the behavior recorded in the
[Backend API Contract](../contract/backend-api.md). See
[Backend Architecture](../architecture/backend.md) for the internal service
boundaries.

## LLM output is validated before it's trusted

LLM output is never an authority. Automatic skill inference is checked against
real `Skill` entities before anything is persisted. Agent orchestration first
loads the complete canonical skill catalog with names and descriptions, then the backend resolves every
selected identifier against current data, chooses only fully qualified
developers using deterministic workload ranking, and creates the entire tree
transactionally. Clarification and provider failure perform no writes. See
[Frontend Architecture — Agent-Assisted Task Planning](../architecture/frontend.md#agent-assisted-task-planning)
and [Add Task Skill Inference](../tasks/05b-add-task-skill-inference.md).

## Tooling stays proportional to scope

Turborepo and per-app Docker images are real complexity — each is included
because it earns its place (shared-types drift prevention, pruned container
images), not by default. When a tool's payoff doesn't match the project's size,
the docs say so explicitly instead of quietly justifying it after the fact. See
[Requirements — Note on scope](../requirements.md#note-on-scope).
