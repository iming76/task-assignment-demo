---
title: Requirements
sidebar_position: 2
---

# Requirements

Functional scope by part. Each row is a one-line summary; implementation details
live in the numbered plans under [Tasks](./tasks/overview.md) and the target
[Backend API Contract](./contract/backend-api.md).

| Part                | Requirement                                                                                                        | Detail                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database            | Normalized categories, described skills, developer/task skill joins, self-referencing tasks, and seeded data       | [Relational schema](./tasks/02a-add-relational-task-schema.md), [database seeds](./tasks/03a-add-database-seeds.md)                                                  |
| Backend API         | Resource CRUD plus typed agent proposal/apply endpoints, with all business rules enforced server-side              | [Backend API foundation](./tasks/03b-add-backend-api-foundation.md), [Backend API Contract](./contract/backend-api.md)                                               |
| Frontend            | Dashboard, resource pages, and reviewed agent-task planning, with confirmed deletion and skill-filtered assignment | [Task tree UI](./tasks/05c-add-task-tree-ui.md), [resource UI](./tasks/05d-add-resource-management-ui.md), [agent planning UI](./tasks/06b-add-agent-planning-ui.md) |
| Subtasks            | Arbitrary-depth nesting, recursive Done check, recursive form UI                                                   | [Subtask completion invariants](./tasks/05a-add-subtask-completion-invariants.md), [task tree UI](./tasks/05c-add-task-tree-ui.md)                                   |
| LLM skill inference | Automatic inference for each created task whose request omits skills, with validated output and safe fallback      | [Task skill inference](./tasks/05b-add-task-skill-inference.md)                                                                                                      |
| Agent planning      | Recursive task-and-assignment drafts require review; explicit apply is revalidated and transactional               | [Agent planning API](./tasks/05e-add-agent-planning-api.md), [agent planning UI](./tasks/06b-add-agent-planning-ui.md)                                               |
| Docker              | Per-app Dockerfiles via `turbo prune`, `docker-compose up` with zero manual steps                                  | [Pruned images](./tasks/07a-add-pruned-container-images.md), [Compose stack](./tasks/07b-add-compose-stack.md)                                                       |
| Deliverables        | Public repo, README covering monorepo rationale + setup + design, sensible commit history                          | [Validate and document delivery](./tasks/08a-validate-and-document-delivery.md)                                                                                      |
| Monorepo/Types      | `shared-types` actually imported by both apps, no duplicated interfaces                                            | [Architecture](./architecture/overview.md)                                                                                                                           |

**Cross-cutting:** TypeScript strictness, consistent error handling, sensible commit history — see [Coding Standards](./constitution/coding-standards.md).

## Evaluation rubric

| Part                | Pass bar                                                                        | Common fail signal                                                                     |
| ------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| DB Design           | Normalized join tables, correct seed data                                       | Skills hardcoded as enum                                                               |
| Backend API         | Resource and agent-plan endpoints enforce validation and business rules         | Validation only in frontend                                                            |
| Frontend            | Dashboard, resource pages, reviewed agent plans, and confirmed deletion         | Generated plan bypasses review or skill matching; deletes skip confirmation            |
| Subtasks            | Arbitrary depth, recursive Done check, recursive form UI                        | Single-level only                                                                      |
| LLM skill inference | Automatic when skills are omitted, independently validated for every task       | Manual trigger; untrusted free-text write                                              |
| Agent planning      | Reviewable recursive draft followed by explicit, transactional, validated apply | Generation persists immediately or accepts stale/unknown identifiers                   |
| Monorepo/Types      | Shared types actually imported by both apps, no duplication                     | Types redefined separately in frontend and backend despite shared package existing     |
| Docker              | Clean `docker-compose up`, pruned images, auto-seed                             | Full monorepo copied into each image; requires local `pnpm install` outside containers |

## Note on scope

Turborepo's main payoff in a project this size is the **shared-types package** —
a single source of truth for `Task`/`Developer`/`Category`/`Skill`/DTOs consumed
by both frontend and backend, eliminating type drift between them. The
build-caching/parallelization benefits of Turborepo are less impactful at this
scale (two apps, run once or twice by a grader) but the tool is included here
per requirement; keep the pipeline config minimal and let the README explain
the rationale so it doesn't read as unnecessary complexity relative to the
project's scope.
