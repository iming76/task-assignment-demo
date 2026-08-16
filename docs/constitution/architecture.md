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

## Contract-first API

The OpenAPI spec is the source of truth for routes, request/response shapes, and validation — handlers implement operations the spec defines, not the other way around. Spec changes drive handler and type changes, not vice versa. Until that specification is created, the [Backend API Contract](../contract/backend-api.md) records the proposed design. See [Backend Architecture](../architecture/backend.md) for the internal service boundaries.

## LLM output is validated before it's trusted

LLM output is always a proposal, never an authority. Automatic skill inference
is checked against real `Skill` entities before anything is persisted; a failed
or malformed inference call degrades gracefully rather than blocking ordinary
task creation. Agent-assisted task plans remain editable drafts until the user
explicitly applies them. Applying a plan resolves every generated identifier
against current data, rechecks assignment and hierarchy rules, and creates the
entire tree transactionally. See
[Frontend Architecture — Agent-Assisted Task Planning](../architecture/frontend.md#agent-assisted-task-planning)
and [Add Task Skill Inference](../tasks/05b-add-task-skill-inference.md).

## Tooling stays proportional to scope

Turborepo, contract-first OpenAPI, and per-app Docker images are all real complexity — each is included because it earns its place (shared-types drift prevention, pruned container images), not by default. When a tool's payoff doesn't match the project's size, the docs say so explicitly instead of quietly justifying it after the fact. See [Requirements — Note on scope](../requirements.md#note-on-scope).
