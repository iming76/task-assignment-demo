---
title: Backend API Contract
sidebar_position: 1
---

# Backend API Contract

The human-readable request/response contract for `apps/backend`, elaborating
the plans in
[Backend API Foundation](../tasks/03b-add-backend-api-foundation.md),
[Task Tree UI](../tasks/05c-add-task-tree-ui.md), and the
[shared API contracts](../constitution/architecture.md#shared-api-contracts)
rule. Types mirror [Data Model](../architecture/data-model.md) and are shared
via `packages/shared-types` — nothing here is redefined independently in
either app.

## Conventions

- Base path: `/` (no versioning prefix for this scope).
- All request/response bodies are JSON; `Content-Type: application/json`.
- IDs are strings (UUIDs).
- No authentication/authorization — out of scope for this project.

### Error shape

All non-2xx responses use one consistent shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description of what failed"
  }
}
```

| Code                  | HTTP status | Meaning                                                                |
| --------------------- | ----------- | ---------------------------------------------------------------------- |
| `VALIDATION_ERROR`    | 400         | Request body/params fail schema validation                             |
| `NOT_FOUND`           | 404         | Referenced resource (task, developer, skill) does not exist            |
| `SKILL_MISMATCH`      | 409         | Assignee's skills don't cover the task's required skills               |
| `SUBTASKS_INCOMPLETE` | 409         | Attempted to set `status: "DONE"` while a descendant is `"TODO"`       |
| `COMPLETED_ANCESTOR`  | 409         | A write would put a `"TODO"` task beneath a `"DONE"` ancestor          |
| `IN_USE`              | 409         | Delete rejected because another record still references it             |
| `AGENT_UNAVAILABLE`   | 503         | Agent planning is not configured, timed out, or returned no valid plan |
| `INTERNAL_ERROR`      | 500         | An unexpected server failure occurred; internal details are hidden     |

## Schemas

`Developer`, `Category`, `Skill`, and `Task` are defined once in `packages/shared-types`
— see [Data Model](../architecture/data-model.md) for the canonical interfaces and
underlying DB schema. Endpoints below return these shapes directly, with
join tables (`developer_skills`, `task_skills`) flattened into `skillIds` /
`requiredSkillIds` arrays.

Each `Skill` includes `description` and `categoryId`. Categories are normalized
resources rather than hardcoded string enums.

Agent planning uses a bounded conversation and discriminated response from the
same shared package:

```ts
interface AgentTaskRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

type AgentTaskResponse =
  | { status: "needs_clarification"; question: string }
  | {
      status: "created";
      message: string;
      tasks: Task[];
      staffingGaps: AgentTaskStaffingGap[];
    };
```

Created outcomes return the flat persisted `Task` records linked through
`parentTaskId`, plus structured details for valid tasks that could not be
assigned.

## Endpoints

### `GET /tasks`

List every task as a flat JSON array. Each item includes `parentTaskId` and its
one-based `depth`, allowing the frontend to construct the arbitrary-depth tree
without the API returning a different nested shape. Pagination and filtering
are out of scope for the assignment-sized dataset.

**Responses**

- `200 OK` — returns `Task[]`, ordered by `id` for a deterministic result.

### `POST /tasks`

Create a task.

**Request body**

```json
{
  "title": "Wire up assignment endpoint",
  "description": "Add the endpoint and enforce skill eligibility.",
  "requiredSkillIds": ["skill-backend"],
  "parentTaskId": null
}
```

- `title` — required, non-empty string.
- `description` — required, non-empty string containing the task context.
- `requiredSkillIds` — optional. Omitting the property triggers automatic skill
  inference. Supplying it, including an explicit `[]`, skips inference. Valid
  inferred IDs are persisted; failed or malformed inference degrades to `[]`
  and the returned task is visibly untagged.
- `parentTaskId` — optional, must reference an existing task if present.
- `depth` is server-managed and must not be supplied by clients.
- New tasks start with `status: "TODO"` and `assigneeId: null`. Root tasks have
  `depth: 1`; subtasks receive their parent's depth plus one.
- Nesting is bounded by `MAX_TASK_DEPTH = 3` (from `packages/shared-types`):
  a task whose computed depth would exceed `3` is rejected.

**Responses**

- `201 Created` — returns the created `Task`.
- `400 VALIDATION_ERROR` — missing/invalid `title` or `description`, malformed
  IDs, or a `parentTaskId` whose depth is already at `MAX_TASK_DEPTH`.
- `404 NOT_FOUND` — a supplied `parentTaskId` or `requiredSkillIds` entry does
  not resolve to an existing resource.
- `409 COMPLETED_ANCESTOR` — `parentTaskId` points to a `"DONE"` task; reopen
  the parent before adding an incomplete child.

### `GET /tasks/:id`

Read a single task with all relevant properties.

**Responses**

- `200 OK` — returns the `Task`.
- `404 NOT_FOUND` — no task with that id.

### `PATCH /tasks/:id`

Update a task's title, description, assignee, required skills, and/or status.
This is where the server-side business rules are enforced.

**Request body** (send at least one field)

```json
{
  "description": "Add the endpoint, tests, and API documentation.",
  "assigneeId": "dev-bob",
  "requiredSkillIds": ["skill-backend"],
  "status": "DONE"
}
```

- `assigneeId` accepts a developer ID or `null` to unassign the task.
- `title` and `description`, when supplied, must be non-empty strings.
- `requiredSkillIds` replaces the complete required-skill set. An explicit
  `[]` means the task intentionally has no required skills; PATCH never invokes
  LLM inference.
- `status` accepts only `"TODO"` or `"DONE"`.
- If required skills change while the task is assigned, the existing assignee
  must still cover the new set or the request is rejected with
  `SKILL_MISMATCH`; the server never silently unassigns a task.

**Responses**

- `200 OK` — returns the updated `Task`.
- `400 VALIDATION_ERROR` — empty request body, invalid title, description, or
  `status`, or malformed IDs.
- `404 NOT_FOUND` — task, referenced `assigneeId`, or a
  `requiredSkillIds` entry does not exist.
- `409 SKILL_MISMATCH` — `assigneeId`'s skills don't cover
  `requiredSkillIds`. Checked whenever `assigneeId` is set or changed.
- `409 SUBTASKS_INCOMPLETE` — `status: "DONE"` requested while any subtask,
  at any depth, is not `"DONE"`.
- `409 COMPLETED_ANCESTOR` — `status: "TODO"` requested while any ancestor is
  `"DONE"`; reopen ancestors from the root downward first.

### `DELETE /tasks/:id`

Delete a task.

**Responses**

- `204 No Content` — the task was deleted.
- `404 NOT_FOUND` — no task with that id.
- `409 IN_USE` — the task still has one or more subtasks; delete or
  re-parent them first.

### `GET /developers`

List all developers for assignment controls.

**Responses**

- `200 OK` — returns `Developer[]`, ordered by `name` and then by `id`.

### `POST /developers`

Create a developer.

**Request body**

```json
{
  "name": "Alice",
  "skillIds": ["skill-backend"]
}
```

- `name` — required, non-empty string.
- `skillIds` — optional; every id must reference an existing `Skill`.

**Responses**

- `201 Created` — returns the created `Developer`.
- `400 VALIDATION_ERROR` — missing/empty `name` or malformed `skillIds`.
- `404 NOT_FOUND` — a supplied `skillIds` entry does not resolve to an
  existing `Skill`.

### `GET /developers/:id`

**Responses**

- `200 OK` — returns the `Developer`.
- `404 NOT_FOUND` — no developer with that id.

### `PATCH /developers/:id`

Update a developer's name and/or skills (send at least one field).

**Responses**

- `200 OK` — returns the updated `Developer`.
- `400 VALIDATION_ERROR` — empty request body, empty `name`, or malformed
  `skillIds`.
- `404 NOT_FOUND` — developer, or a `skillIds` entry, does not exist.

### `DELETE /developers/:id`

Delete a developer.

**Responses**

- `204 No Content` — the developer was deleted.
- `404 NOT_FOUND` — no developer with that id.
- `409 IN_USE` — the developer is still assigned as a task's `assigneeId`;
  reassign or unassign those tasks first.

### `GET /skills`

List all skills for task creation and editing controls.

**Responses**

- `200 OK` — returns `Skill[]`, ordered by `categoryId`, `name`, and then `id`.

### `POST /skills`

Create a skill.

**Request body**

```json
{
  "name": "Node.js",
  "description": "Server-side JavaScript runtime used to build backend services.",
  "categoryId": "category-backend"
}
```

- `name` — required, non-empty, and unique within its category.
- `description` — required, non-empty context used by people and the assignment
  agent.
- `categoryId` — required and must reference an existing `Category`.

**Responses**

- `201 Created` — returns the created `Skill`.
- `400 VALIDATION_ERROR` — a required field is missing or empty, or the category
  already contains a skill with that name.
- `404 NOT_FOUND` — `categoryId` does not resolve to an existing category.

### `GET /skills/:id`

**Responses**

- `200 OK` — returns the `Skill`.
- `404 NOT_FOUND` — no skill with that id.

### `PATCH /skills/:id`

Update a skill's name, description, and/or category. Send at least one field.

**Request body**

```json
{
  "description": "JavaScript runtime for backend services and command-line tools."
}
```

**Responses**

- `200 OK` — returns the updated `Skill`.
- `400 VALIDATION_ERROR` — the body is empty, a supplied value is empty, or the
  target category already contains a skill with that name.
- `404 NOT_FOUND` — no skill or supplied category exists with that id.

### `DELETE /skills/:id`

Delete a skill.

**Responses**

- `204 No Content` — the skill was deleted.
- `404 NOT_FOUND` — no skill with that id.
- `409 IN_USE` — the skill is still required by a task or held by a
  developer; remove those references first.

### `GET /categories`

List categories for skill forms and agent context.

**Responses**

- `200 OK` — returns `Category[]`, ordered by `name` and then by `id`.

### `GET /categories/:id`

**Responses**

- `200 OK` — returns the `Category`.
- `404 NOT_FOUND` — no category with that id.

### `POST /agent-task`

Process a bounded natural-language conversation. The agent must load the
complete current skill list with names and descriptions before selecting canonical
skill IDs. It either asks one clarification question or returns a structured
plan that the backend validates, assigns, and persists atomically.

**Request body**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Build profile editing with AI image moderation."
    }
  ]
}
```

- `messages` — 1–20 non-empty user/assistant messages, beginning and ending
  with a user message. Follow-ups include the prior assistant question.

**Clarification response (`200`)**

```json
{
  "status": "needs_clarification",
  "question": "Which profile fields should users edit?"
}
```

Clarification performs no writes. The client appends the question and answer to
the next request's conversation.

**Created response (`201`)**

```json
{
  "status": "created",
  "message": "Created 1 task. One task remains unassigned and requires AI Engineer.",
  "tasks": [
    {
      "id": "task-1",
      "title": "Build AI image moderation",
      "description": "Detect unsafe profile images.",
      "status": "TODO",
      "depth": 1,
      "assigneeId": null,
      "parentTaskId": null,
      "requiredSkillIds": ["skill-ai"]
    }
  ],
  "staffingGaps": [
    {
      "taskId": "task-1",
      "taskTitle": "Build AI image moderation",
      "requiredRole": "AI Engineer",
      "requiredSkillIds": ["skill-ai"]
    }
  ]
}
```

- Each node is assigned only when a current developer covers every required
  skill. Eligible developers are ranked by non-completed workload and stable
  ID, with in-request workload increments.
- A valid node with no qualified developer is created with `assigneeId: null`
  and reported in `staffingGaps`; this is not an error.
- Unsearched, unknown, or stale generated skill IDs are rejected.
- Any invalid plan or persistence failure rolls back the complete tree.

**Responses**

- `200 OK` — clarification outcome; no task is created.
- `201 Created` — persisted tasks and staffing gaps.
- `400 VALIDATION_ERROR` — malformed or over-limit conversation.
- `503 AGENT_UNAVAILABLE` — planning is unavailable or produces an invalid
  decision; no partial task tree is retained.

## Non-goals

- Search, filtering, and pagination for resource endpoints are out of scope.
- Embeddings, persistent conversations, developer calendars/capacity, and
  durable orchestration idempotency are out of scope.
