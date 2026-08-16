---
title: AI Guidelines
sidebar_position: 4
---

# AI Guidelines

Guidance for an AI agent (or anyone else) making changes in this repo.

## Propose changes through `openspec`

`openspec/` (`changes/`, `specs/`) is scaffolded for a spec-driven workflow — track non-trivial changes as an openspec change rather than editing code ad hoc, so `openspec/specs/` accumulates capabilities in the same dependency order the [Task Planner](../tasks/overview.md) chart lays out.

## Don't duplicate `shared-types`

If a type for `Task`, `Developer`, `Category`, `Skill`, or a DTO already exists
in `packages/shared-types`, import it — don't redeclare a local copy for
convenience, even a temporary one. See
[Architecture](./architecture.md#shared-types-is-the-single-source-of-truth).

## Match the commit convention

Every commit header must match `type[scope]: subject` with the enums defined in `commitlint.config.js` — see [Coding Standards](./coding-standards.md#commit-messages). A commit that doesn't match the pattern is rejected by the Husky `commit-msg` hook, not just discouraged by convention.

## Honor TDD when it's requested

When a change is meant to follow TDD, tests should be visibly written and failing before the implementation lands. Each numbered task plan lists its required test cases, and [Validate and Document Delivery](../tasks/08a-validate-and-document-delivery.md) collects the final integration checks.

## Keep business rules server-side

Don't move the assignment or status checks into the frontend "for simplicity" — see [Architecture](./architecture.md#business-rules-are-enforced-server-side-never-trusted-from-the-frontend). A frontend-only check is a UX nicety, not a substitute for the server-side rule.

## Keep generated plans reviewable

The `/agent-task` experience must present generated task trees as editable
drafts and require an explicit apply action. Do not persist during generation
or let generated skill and developer identifiers bypass current database and
business-rule checks. See
[Frontend Architecture — Agent-Assisted Task Planning](../architecture/frontend.md#agent-assisted-task-planning).
