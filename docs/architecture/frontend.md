---
title: Frontend Architecture
sidebar_position: 3
---

# Frontend Architecture

This page describes the implemented React + TypeScript application in
`apps/frontend`. See [Task Tree UI](../tasks/05c-add-task-tree-ui.md),
[Resource Management UI](../tasks/05d-add-resource-management-ui.md), and
[Agent Planning UI](../tasks/06b-add-agent-planning-ui.md) for the sequence it
was built in.

## Stack

- **Framework:** React 19 with TypeScript
- **Build tool:** Vite
- **Routing:** React Router
- **Styling:** Tailwind CSS
- **Server state:** TanStack Query
- **Shared components:** `packages/ui` (shadcn/ui primitives)
- **API and domain types:** `packages/shared-types`

There is no separate client-side state library (e.g. Zustand/Redux). All
server data lives in TanStack Query; the small amount of remaining UI-only
state (open dialogs, form drafts, pagination) is local `useState` in the
owning component.

## Layout

```text
apps/frontend/src/
├── api/                  # Typed HTTP client, endpoint calls, and error mapping
├── components/           # App-wide UI: Navbar, dialogs, task tree, agent flow
│   ├── developers/
│   ├── skills/
│   └── tasks/
├── config/               # Navigation metadata and application constants
├── hooks/                # Typed TanStack Query hooks, one module per resource
├── lib/                  # Pure helpers: task-tree derivation, lookups, error messages
├── pages/                # Route-level views
├── providers/            # QueryClientProvider
├── App.tsx               # Application shell and routing
├── main.tsx              # Browser entrypoint
└── index.css             # Tailwind import and global styles
```

Code shared with another application belongs in a workspace package
(`packages/ui`, `packages/shared-types`) rather than a frontend feature
directory.

Navigation is split by responsibility:

- `config/navigation.ts` declares menu labels, route paths, and display order;
- `components/Navbar.tsx` renders that configuration and owns navigation
  interactions; and
- `pages/` contains the views targeted by those routes.

## Routing

`main.tsx` installs `BrowserRouter` and mounts `App` once at the browser
entrypoint. `App.tsx` owns the route-to-page mapping:

| Path         | Page             | Responsibility                                                     |
| ------------ | ---------------- | ------------------------------------------------------------------ |
| `/`          | `DashboardPage`  | Show a summary and the latest tasks with actionable setup guidance |
| `/developer` | `DevelopersPage` | Create, read, update, and delete developers                        |
| `/skill`     | `SkillsPage`     | Create, read, and delete skills                                    |
| `/task`      | `TasksPage`      | Create, read, update, and delete tasks, including nested ones      |
| `*`          | `NotFoundPage`   | Fallback for unmatched routes                                      |

Agent-assisted task creation is not a separate route. `TasksPage` opens the
`AgentTaskModal` (backed by `AgentTaskFlow`) as a dialog over the task list,
alongside the plain `AddTaskDialog` for manual creation — both reuse the same
tree and query hooks that render `/task`.

Creation forms live inside their resource pages as dialogs; there is no
separate `/tasks/new` route.

The dashboard and task page reuse the same task-query hook and task-list
rendering, but they have different purposes: the dashboard is the landing
overview, while `/task` is the complete task-management workspace.

Dashboard setup guidance is driven by query results:

- when the task list is empty, show an empty state with a create-task action
  that navigates to `/task`;
- when the developer list is empty, show a create-developer action that
  navigates to `/developer`; and
- when both lists are empty, show both actions so either setup step can be
  completed first.

The resource pages expose only their documented operations. In particular,
`/skill` lets the user select a category and enter the required agent-facing
description when creating a skill, but does not provide skill editing even if
the backend contract supports it. Developer deletion is unavailable when the
developer is assigned to a task. Skill deletion is unavailable when the skill
belongs to a developer or is required by a task. These UI restrictions explain
likely conflicts, but the backend remains authoritative and enforces the same
reference rules.

## Agent-Assisted Task Planning

`AgentTaskModal` accepts a bounded natural-language conversation and calls the
single backend orchestration endpoint (`POST /agent-task`) through
`useOrchestrateAgentTask`. If essential details are missing, the modal
displays the agent's clarification question, retains the conversation in
local state, and submits the user's follow-up with the prior turns.

When the request is sufficiently clear, the backend agent first loads the
complete canonical skill list with current names and descriptions. The
backend — not the browser or model — revalidates selected IDs, ranks fully
qualified developers by active workload, and creates the complete recursive
tree in one transaction. The response contains persisted flat `Task` records,
which retain `parentTaskId` and `depth` for hierarchical display.

The modal treats missing staffing as a successful outcome. Each task without a
qualified developer remains visibly unassigned, and a structured warning names
the required role and skill IDs. There is no draft editor or separate
apply/discard step: a request either fails validation (nothing is created) or
succeeds and the created tree is shown immediately.

Agent orchestration stays in the backend behind the shared discriminated API
contract. The frontend never sends provider credentials, calls a provider
directly, chooses assignments, or treats generated identifiers as trusted.

## Boundaries

- `packages/shared-types` owns `Task`, `Developer`, `Category`, `Skill`, and
  all API DTOs. The frontend imports those definitions and only declares
  UI-specific types locally.
- `api/` owns base-URL configuration, JSON parsing, endpoint calls, and
  conversion of the backend error envelope into user-safe errors. Components
  do not call `fetch` directly.
- TanStack Query owns remote data, request lifecycle state, caching, and cache
  invalidation after mutations.
- `hooks/` own TanStack Query query and mutation definitions, one module per
  resource (`useTasks`, `useCreateTask`, and so on); a generic `useFetch` would
  duplicate behavior already provided by TanStack Query.
- `lib/` owns pure derivations such as the task tree (`task-tree.ts`) and
  display lookups (`lookup.ts`). It does not fetch data.
- `config/` owns static, environment-independent application metadata (route
  labels). It does not become a catch-all for mutable state or business rules.
- Components own rendering and transient interaction state. They do not
  reproduce backend validation as an authority.
- `packages/ui` contains generic presentation primitives; task-specific
  components and the application navbar remain in the frontend application.

## State Ownership

Each value has one owner:

| State                                                | Owner             |
| ---------------------------------------------------- | ----------------- |
| Tasks, developers, categories, skills, and API state | TanStack Query    |
| Mutation progress and server responses               | TanStack Query    |
| Dialog open/closed, form drafts, pagination          | Local React state |
| Route state                                          | The URL           |

API entities are never copied into a separate client-side store. Keeping
server data in TanStack Query prevents two caches from drifting and makes
invalidation after a mutation predictable.

## Data Flow

1. A typed query hook calls `api/` for tasks, developers, categories, or
   skills.
2. TanStack Query caches the returned DTOs imported from `@repo/shared-types`
   and exposes request state to the page.
3. Task feature code (`lib/task-tree.ts`) derives roots and child collections
   from the cached flat task list using `parentTaskId`.
4. `TaskTreeNode` renders the tree recursively at arbitrary depth.
5. A form or control invokes a TanStack Query mutation that submits a typed
   create or patch request.
6. After success, the mutation invalidates the relevant query; after failure,
   the backend error is shown beside the affected interaction.

Server responses remain the source of truth after every mutation. Optimistic
UI must not leave an assignment or status visible as successful after the
server rejects it.

## Task Tree

The API returns a flat task collection. `buildTaskTree` (`lib/task-tree.ts`)
derives a tree without changing the shared `Task` shape, indexing tasks by
`parentTaskId`. `TaskTreeNode` is one recursive component so root tasks and
subtasks support the same creation, assignment, and status interactions.

Tree construction is defensive: an orphaned task (a `parentTaskId` that does
not resolve to a loaded task) remains visible in a dedicated section rather
than silently disappearing, and construction cannot recurse infinitely on
malformed data. These safeguards are for rendering resilience, not substitutes
for backend integrity checks.

## Forms and Assignment

Task creation distinguishes between omitted and explicit skill selections:

- omit `requiredSkillIds` to request automatic skill inference;
- send `requiredSkillIds: []` when the user intentionally selects no required
  skills (achieved by leaving "Required assignee" off); and
- set `parentTaskId` when creating beneath an existing task.

The assignee control (`TaskAssignmentFields`) lists only developers whose
`skillIds` contain every skill in the task's `requiredSkillIds`, ordered by
fewest incomplete tasks. This filtering guides the user, but the backend still
enforces eligibility. Required skills remain editable so a failed or incorrect
inference can be corrected.

## Status and Error Handling

The UI submits status changes directly to the API and explains domain errors
in the context of the attempted action. The shared and API values remain
`TODO` and `DONE`; the presentation layer maps them to the user-facing labels
without changing the transport shape. In particular:

- `SKILL_MISMATCH` prompts the user to choose an eligible developer or correct
  the task's required skills;
- `SUBTASKS_INCOMPLETE` directs completion from leaves upward;
- `COMPLETED_ANCESTOR` directs reopening from the root downward; and
- `IN_USE` explains which references must be removed before a developer,
  skill, or task can be deleted.

Loading, empty, pending, success, and failure states are explicit
(`RouteState.tsx`). Unexpected errors use a safe fallback message
(`error-message.ts`) while preserving diagnostic detail for development logs.

## Destructive Actions

Every delete action requires an explicit confirmation modal
(`ConfirmDeleteDialog`) before the frontend sends the request. The modal
identifies the resource being deleted, provides cancel and confirm actions,
and disables repeated submission while the request is pending. Canceling
closes the modal without changing data.

A successful deletion invalidates the relevant TanStack Query cache. If the
server rejects deletion (`IN_USE`), the resource remains visible and the modal
shows the returned user-safe error. The frontend does not rely only on locally
cached task, developer, or skill relationships to decide that a deletion is
safe.

## Runtime Configuration

The backend base URL is supplied through `VITE_API_BASE_URL` and read only in
`api/`. Deployments must set this variable to the externally reachable API
origin before running the Vite production build. As with every
`VITE_`-prefixed variable, its value is embedded in the browser bundle and
must never contain a secret. The production build emits static `dist/` assets
suitable for serving with nginx (see `apps/frontend/Dockerfile`).

## Testing

Component and page tests use Vitest and React Testing Library with mocked HTTP
responses. Coverage focuses on user-visible behavior: loading and error
states, skill-filtered assignment, omitted versus empty skill selections,
recursive creation, a tree at least three levels deep, orphaned-task recovery,
and actionable messages for domain conflicts. `packages/ui` additionally runs
Storybook interaction tests for shared primitives.

See [Backend Architecture](./backend.md) for server-side enforcement,
[Data Model](./data-model.md) for shared domain shapes, and
[Backend API Contract](../contract/backend-api.md) for the endpoints consumed
by the frontend.
