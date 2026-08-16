---
slug: /
title: Introduction
sidebar_position: 1
---

# Task Assignment

This site documents the target application behavior. The repository is still in the planning and scaffolding phase; unchecked items under [Tasks](./tasks/overview.md) are not implemented yet.

Task Assignment routes work to the developer who can actually do it. Every task carries the skill(s) it requires, every developer carries the skill(s) they have, and the system won't let you assign one to the other unless they match — so "who should pick this up" stops being a manual judgment call and starts being something the app enforces.

**Three things make it more than a basic task list:**

- **Subtasks** — a task can be broken down into nested subtasks (to any depth), and a parent can't be closed out as "Done" until every subtask underneath it is. This mirrors how real work actually decomposes instead of forcing everything into a flat backlog.
- **LLM skill tagging** — writing a task title and description and manually
  picking its required skills is friction most people skip. When the request
  omits skills, the backend attempts to infer them from the task context before
  saving. Valid suggestions participate in the normal matching rule; if
  inference fails, creation still succeeds with no required skills and the task
  remains visibly untagged until a user supplies them.
- **Agent-assisted planning** — a user can describe a larger body of work and
  answer clarification questions when needed. The agent discovers canonical
  skills by loading their names and descriptions; the backend validates the plan, assigns qualified
  developers by workload, and creates the tree transactionally. Work without a
  qualified developer remains unassigned and is reported as a staffing gap.

## Where to start

- [Requirements](./requirements.md) — functional scope by part and the evaluation rubric
- [Architecture](./architecture/overview.md) — repo layout, tech stack, Turborepo pipeline
- [Data Model](./architecture/data-model.md) — `Developer`/`Skill`/`Task` schema and shared types
- [Backend API Contract](./contract/backend-api.md) — resource and agent-planning endpoints, request/response shapes, and errors
- [Architecture Principles](./constitution/architecture.md) — the rules that recur across the codebase
- [Coding Standards](./constitution/coding-standards.md) — linting, formatting, commit conventions
- [Security](./constitution/security.md) — untrusted LLM output, input validation, secrets
- [AI Guidelines](./constitution/ai-guidelines.md) — how an AI agent should work in this repo
- [OpenSpec change start order](./tasks/overview.md) — the complete dependency graph and numbered implementation waves
- [Backend workspace](./tasks/01a-add-backend-workspace.md), [shared domain types](./tasks/01b-add-shared-domain-types.md), and [shared UI system](./tasks/01c-add-shared-ui-system.md) — the three changes that can start immediately
- [Backend API foundation](./tasks/03b-add-backend-api-foundation.md) and wave `04` — documented resource behavior and assignment rules
- Wave `05` — recursive completion, skill inference, task/resource UI, and agent planning
- Waves `07`–`08` — pruned containers, Docker Compose, integrated validation, and delivery documentation
