---
title: Security
sidebar_position: 3
---

# Security

## LLM output is untrusted input

The planned skill-inference service must check output against real `Skill`
entities before persisting it—the LLM must never write a free-text value
directly into the database. A malformed or failed inference call degrades to an
empty required-skill set, and ordinary task creation still succeeds. See
[Add Task Skill Inference](../tasks/05b-add-task-skill-inference.md).

Agent-assisted task planning follows the same trust boundary. Before creating a
plan, the agent searches canonical skills by name and description. The backend
parses the structured decision, rejects unsearched or stale IDs, derives
assignment from current developer skills and workload, and commits the complete
tree in one transaction. Clarification, malformed output, invalid plans, and
failed writes leave the database unchanged. See
[Frontend Architecture — Agent-Assisted Task Planning](../architecture/frontend.md#agent-assisted-task-planning).

## Input validation lives on the server

Every planned endpoint must validate its input at the server boundary (see [Architecture — shared API contracts](./architecture.md#shared-api-contracts)) regardless of what the frontend already checked client-side. Errors use a single consistent response shape so failures are predictable and don't leak internal details (stack traces, ORM errors, raw exception messages) to the caller.

## Secrets

LLM provider API keys and other credentials are supplied through environment variables and are never committed. Local `.env` files are git-ignored; deployment environments, CI secret stores, and the planned `docker-compose.yml` may map secret values into those variables without embedding credentials in version-controlled files.
