---
title: Frontend Architecture
sidebar_position: 3
---

# Frontend Architecture

This page describes the target design of the planned React + TypeScript
application in `apps/frontend`. The application has not been scaffolded yet;
the implementation sequence is defined in
[Task Tree UI](../tasks/05c-add-task-tree-ui.md).

## Stack

- **Framework:** React with TypeScript
- **Build tool:** Vite
- **Routing:** React Router
- **Styling:** Tailwind CSS
- **Server state:** TanStack Query
- **Client state:** Zustand
- **Shared components:** `packages/ui`
- **API and domain types:** `packages/shared-types`

## Layout

The frontend should keep transport, domain-derived state, and presentation
separate:

```text
apps/frontend/src/
├── components/          # App-wide UI such as Navbar and task components
├── config/              # Navigation metadata and application constants
├── hooks/               # Typed TanStack Query hooks and reusable React hooks
├── pages/               # Route-level task list and creation views
├── providers/           # QueryClientProvider and future app-wide providers
├── services/            # Typed HTTP client, endpoint calls, and error mapping
├── stores/              # Zustand stores for shared client-only state
├── utils/               # Pure helpers such as tree and eligibility derivation
├── App.tsx              # Application shell and routing
├── main.tsx             # Browser entrypoint
└── index.css            # Tailwind import and global styles
```

The exact filenames may evolve during implementation, but these boundaries
should remain. Code shared with another application belongs in a workspace
package rather than a frontend feature directory.

A generic `context/` directory is not part of the initial layout. TanStack
Query is configured through `providers/`, and Zustand stores do not require a
React Context provider. Add a context only when a concrete dependency needs to
be scoped to a React subtree. Likewise, do not create an empty `stores/` or
`utils/` directory before the first implementation belongs there.

Navigation is split by responsibility:

- `config/navigation.ts` declares menu labels, route paths, and display order;
- `components/Navbar.tsx` renders that configuration and owns navigation
  interactions; and
- `pages/` contains the views targeted by those routes.

Navigation configuration contains static metadata, not fetched permissions or
mutable selection state. The router remains the source of truth for the active
route, so the selected menu item is not duplicated in Zustand.

## Routing

The initial route table lives in `App.tsx`. `main.tsx` installs
`BrowserRouter`, while route-level components live in `pages/`. The application
uses these routes:

| Path          | Page             | Responsibility                                                |
| ------------- | ---------------- | ------------------------------------------------------------- |
| `/`           | `DashboardPage`  | Show the task list and actionable setup guidance              |
| `/developer`  | `DevelopersPage` | Create, read, update, and delete developers                   |
| `/skill`      | `SkillsPage`     | Create, read, and delete skills                               |
| `/task`       | `TasksPage`      | Create, read, update, and delete tasks, including nested ones |
| `/agent-task` | `AgentTaskPage`  | Generate and review an AI-assisted task and assignment plan   |

`main.tsx` mounts the router once at the browser entrypoint:

```tsx
import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";

import { App } from "./App";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
```

`App.tsx` owns the route-to-page mapping:

```tsx
import { Route, Routes } from "react-router-dom";

import { AgentTaskPage } from "./pages/AgentTaskPage";
import { DashboardPage } from "./pages/DashboardPage";
import { DevelopersPage } from "./pages/DevelopersPage";
import { SkillsPage } from "./pages/SkillsPage";
import { TasksPage } from "./pages/TasksPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/developer" element={<DevelopersPage />} />
      <Route path="/skill" element={<SkillsPage />} />
      <Route path="/task" element={<TasksPage />} />
      <Route path="/agent-task" element={<AgentTaskPage />} />
    </Routes>
  );
}
```

Creation forms are part of their resource pages, so the initial design does not
add a separate `/tasks/new` route. Add a dedicated creation route later only if
the form needs a shareable URL or an independent page lifecycle.

The dashboard and task page may reuse the same task-query hook and task-list
components, but they have different purposes. The dashboard is the landing
overview; `/task` is the complete task-management workspace. Reuse does not
mean copying task data into another client-side store.

Dashboard setup guidance is driven by query results:

- when the task list is empty, show an empty state with a create-task action
  that navigates to `/task`;
- when the developer list is empty, show a create-developer action that
  navigates to `/developer`; and
- when both lists are empty, show both actions so either setup step can be
  completed first.

The resource pages expose only their documented operations. In particular,
`/skill` lets the user select a category and enter the required agent-facing
description when creating a skill, but does not provide skill editing even if a
broader backend contract supports it. Developer deletion is unavailable when
the developer is assigned to a task. Skill deletion is unavailable when the
skill belongs to a developer or is required by a task. These UI restrictions
explain likely conflicts, but the backend remains authoritative and must
enforce the same reference rules.

## Agent-Assisted Task Planning

`/agent-task` accepts a natural-language description and asks a backend agent
to propose a task tree. The proposal contains root tasks and subtasks, canonical
`requiredSkillIds`, and an optional `assigneeId` for each task. The agent
receives the current categorized skill catalog, including skill descriptions,
and the developer catalog as controlled context so it can select only known
skills and skill-eligible developers.

The user-facing proposal follows this recursive shape:

```xml
<Task>
  <name>Implement Task Assignment System</name>
  <description>
    Develop a task assignment system that assigns work based on skills and
    availability.
  </description>
  <SubTaskList>
    <SubTask>
      <name>Frontend</name>
      <description>Develop the frontend using React and TypeScript.</description>
      <assignedDeveloper>John Doe</assignedDeveloper>
      <requiredSkills>
        <skill>JavaScript</skill>
        <skill>React</skill>
      </requiredSkills>
    </SubTask>
    <SubTask>
      <name>Backend</name>
      <description>Develop the backend using Node.js and Fastify.</description>
      <assignedDeveloper>John Doe</assignedDeveloper>
      <requiredSkills>
        <skill>Node.js</skill>
        <skill>Fastify</skill>
      </requiredSkills>
    </SubTask>
  </SubTaskList>
</Task>
```

This XML illustrates the presentation shape, not the API wire format. The typed
draft uses JSON and canonical IDs: `name` maps to `Task.title`,
`assignedDeveloper` maps to `assigneeId`, and each displayed skill name maps to
an entry in `requiredSkillIds`. On apply, the backend flattens the recursive
draft into `Task` records linked by `parentTaskId`. Subtasks use the same draft
shape recursively, so the hierarchy is not limited to one level.

The page presents the proposal as a draft before any tasks are created. The
user can review and correct titles, descriptions, hierarchy, required skills,
and assignments, then explicitly apply or discard the complete plan. A task
remains unassigned when no developer has every required skill; the agent must
not choose a partial match merely to fill the field.

Agent orchestration belongs in the backend behind a typed API contract. The
frontend never sends provider credentials, calls an LLM provider directly, or
treats generated identifiers as trusted. When the user applies a draft, the
backend resolves every identifier against current data, rechecks assignment
eligibility and hierarchy invariants, and creates the plan transactionally so a
partial task tree is not left behind after a failure. This capability requires
a dedicated backend contract in addition to the existing per-task skill
inference behavior.

## Boundaries

- `packages/shared-types` owns `Task`, `Developer`, `Category`, `Skill`, and all API DTOs.
  The frontend imports those definitions and only declares UI-specific types
  locally.
- Services own base-URL configuration, JSON parsing, endpoint calls, and
  conversion of the backend error envelope into user-safe errors. Components
  do not call `fetch` directly.
- TanStack Query owns remote data, request lifecycle state, caching, and cache
  invalidation after mutations.
- Zustand owns only shared client-side state, such as UI preferences or a
  multi-step draft that must survive navigation.
- Hooks own TanStack Query query and mutation definitions. Hooks should be
  domain-specific, such as `useTasks` or `useCreateTask`; a generic `useFetch`
  would duplicate behavior already provided by TanStack Query.
- Utilities own pure derivations such as the task tree and eligible-assignee
  list. They do not fetch data or mutate stores.
- Configuration modules own static, environment-independent application
  metadata. They do not become a catch-all for mutable state or business rules.
- Components own rendering and transient interaction state. They do not
  reproduce backend validation as an authority.
- `packages/ui` contains generic presentation primitives; task-specific
  components and the application navbar remain in the frontend application.

## State Ownership

Each value has one owner:

| State                                                 | Owner             |
| ----------------------------------------------------- | ----------------- |
| Tasks, developers, categories, skills, and API state  | TanStack Query    |
| Mutation progress and server responses                | TanStack Query    |
| Input values used by one mounted form or component    | Local React state |
| Shared client-only preferences and cross-route drafts | Zustand           |
| Route and shareable filter state                      | The URL           |

API entities must not be copied into Zustand. Keeping server data in TanStack
Query prevents two caches from drifting and makes invalidation after a mutation
predictable. A `stores/` directory is created only when the application has
real cross-component client state; Zustand does not justify an empty store.

## Data Flow

1. A typed query hook calls a service for tasks, developers, categories, or skills.
2. TanStack Query caches the returned DTOs imported from
   `@repo/shared-types` and exposes request state to the page.
3. Task feature code derives roots and child collections from the cached task
   list using `parentTaskId`.
4. Recursive task components render the tree at arbitrary depth.
5. A form or control invokes a TanStack Query mutation that submits a typed
   create or patch request.
6. After success, the mutation updates or invalidates the relevant query;
   after failure, the backend error is shown beside the affected interaction.

Server responses remain the source of truth after every mutation. Optimistic UI
must not leave an assignment or status visible as successful after the server
rejects it.

## Task Tree

The API returns a flat task collection. The frontend derives a tree without
changing the shared `Task` shape, for example by indexing tasks by
`parentTaskId`. Rendering uses one recursive node component so root tasks and
subtasks support the same creation, assignment, and status interactions.

Tree construction must be defensive: an orphaned task remains visible, and a
cycle in malformed data cannot cause infinite recursion. These safeguards are
for rendering resilience, not substitutes for backend integrity checks.

## Forms and Assignment

Task creation distinguishes between omitted and explicit skill selections:

- omit `requiredSkillIds` to request automatic skill inference;
- send `requiredSkillIds: []` when the user intentionally selects no required
  skills; and
- set `parentTaskId` when creating beneath an existing task.

The assignee control lists only developers whose `skillIds` contain every skill
in the task's `requiredSkillIds`. This filtering guides the user, but the backend
still enforces eligibility. Required skills remain editable so a failed or
incorrect inference can be corrected.

## Status and Error Handling

The UI submits status changes directly to the API and explains domain errors in
the context of the attempted action. The shared and API values remain `TODO`
and `DONE`; the presentation layer maps them to the user-facing labels “To-do”
and “Done” without changing the transport shape. In particular:

- `SKILL_MISMATCH` prompts the user to choose an eligible developer or correct
  the task's required skills;
- `SUBTASKS_INCOMPLETE` directs completion from leaves upward; and
- `COMPLETED_ANCESTOR` directs reopening from the root downward.
- `IN_USE` explains which references must be removed before a developer, skill,
  or task can be deleted.

Loading, empty, pending, success, and failure states are explicit. Unexpected
errors use a safe fallback message while preserving diagnostic detail for
development logs.

## Destructive Actions

Every delete action requires an explicit confirmation modal before the frontend
sends the request. The modal identifies the resource being deleted, provides
cancel and confirm actions, and disables repeated submission while the request
is pending. Canceling closes the modal without changing data.

A successful deletion invalidates the relevant TanStack Query cache. If the
server rejects deletion, the resource remains visible and the modal or
associated page shows the returned user-safe error. The frontend must not rely
only on locally cached task, developer, or skill relationships to decide that a
deletion is safe.

## Runtime Configuration

The backend base URL is supplied through `VITE_API_BASE_URL` and read only in
the service layer. Deployments must set this variable to the externally
reachable API origin before running the Vite production build. As with every
`VITE_`-prefixed variable, its value is embedded in the browser bundle and must
never contain a secret. The production build emits static `dist/` assets
suitable for serving with nginx.

## Testing

Component and feature tests use React Testing Library with mocked HTTP
responses. Coverage focuses on user-visible behavior: loading and error states,
skill-filtered assignment, omitted versus empty skill selections, recursive
creation, a tree at least three levels deep, and actionable messages for domain
conflicts.

See [Backend Architecture](./backend.md) for server-side enforcement,
[Data Model](./data-model.md) for shared domain shapes, and
[Backend API Contract](../contract/backend-api.md) for the endpoints consumed by
the frontend.
