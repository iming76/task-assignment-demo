# Task Assignment Demo

A full-stack task assignment application for organizing nested work, matching
developers to the skills a task requires, and generating recursive task plans
from natural language with an AI agent.

The repository is a pnpm/Turborepo monorepo. Shared domain and API types live in
one package so the React frontend and Fastify backend use the same contracts.

## Features

- Create and manage tasks, subtasks, developers, skills, and skill categories.
- Assign only developers whose skills satisfy a task's requirements.
- Track task completion while enforcing parent/subtask completion rules.
- Generate a recursive task tree from a natural-language conversation with an
  LLM; the agent asks a clarifying question when needed and otherwise creates
  the fully validated tree in one transaction.
- Persist application data in PostgreSQL through Prisma.
- Share typed request, response, domain, and error contracts across applications.

## Tech stack

- React 19, Vite, TanStack Query, Tailwind CSS, and shadcn/ui
- Node.js, TypeScript, Fastify, Prisma, and PostgreSQL
- Vercel AI SDK with an OpenAI provider for optional agent planning
- Vitest, React Testing Library, ESLint, Prettier, and Storybook
- pnpm workspaces and Turborepo

## Repository structure

```text
apps/
  backend/           Fastify API, services, repositories, and Prisma schema
  frontend/          React application
  doc/               Docusaurus documentation site
packages/
  shared-types/      Domain models and public API contracts
  ui/                Shared UI components and Storybook stories
  eslint-config/     Shared ESLint configuration
  typescript-config/ Shared TypeScript configuration
docs/                Requirements, architecture, API contract, and task plans
openspec/            OpenSpec specifications and change history
```

## Prerequisites

- Node.js 20 or newer
- pnpm 9
- Docker, or a locally accessible PostgreSQL 16 instance

## Local setup

Install dependencies:

```sh
pnpm install
```

Create the backend environment file:

```sh
cp apps/backend/.env.example apps/backend/.env
```

Start PostgreSQL with Docker Compose:

```sh
docker compose up -d db
```

Generate the Prisma client and apply migrations:

```sh
pnpm --filter backend db:generate
pnpm --filter backend db:migrate
```

Start the development workspaces:

```sh
pnpm dev
```

When the backend starts with an empty database, it automatically creates the
default skill catalog, developers, and developer-skill mappings.

The local services use these ports:

| Service    | URL                   |
| ---------- | --------------------- |
| Frontend   | http://localhost:3000 |
| Backend    | http://localhost:3100 |
| Docs       | http://localhost:3200 |
| Storybook  | http://localhost:6006 |
| PostgreSQL | localhost:5434        |

To run only one application, use a workspace filter. For example:

```sh
pnpm --filter frontend dev
pnpm --filter backend dev
pnpm --filter doc dev
```

### Running the full stack with Docker Compose (Docker-only, no local Node/pnpm)

`docker-compose.yml` defines `db`, `migrator`, `backend`, and `frontend`
services that build production images from `apps/backend/Dockerfile` and
`apps/frontend/Dockerfile` using multi-stage, `turbo prune`-based builds. This
is the only path that needs nothing beyond Docker on a clean clone — skip
`pnpm install` and every step under [Local setup](#local-setup) entirely.
Bring up the whole application, including the database, migrations, and both
apps, with:

```sh
docker compose up -d
```

The `migrator` service applies Prisma migrations and exits before `backend`
starts; `backend` won't start until it exits successfully. The database is
seeded automatically the first time `backend` starts against an empty
database, exactly as in local development. Agent planning and skill inference
are optional here too: omit `OPENAI_API_KEY` and the stack still comes up,
with `POST /agent-task` returning `AGENT_UNAVAILABLE` and task creation
falling back to untagged tasks. To enable them, pass build-time secrets such
as `OPENAI_API_KEY` as environment variables on the host, or in a `.env` file
next to `docker-compose.yml`, since they are forwarded to the `backend`
service. The frontend image is built with `VITE_API_BASE_URL` baked in at
build time, so rebuild it (`docker compose build frontend`) if the backend's
reachable origin changes. Verify the stack with the same [Local development
ports](#local-setup) table above — `docker-compose.yml` maps `frontend` to
`3000` and `backend` to `3100`, matching local development.

## Configuration

Backend settings are read from `apps/backend/.env`:

| Variable                     | Required | Default                 | Purpose                                                  |
| ---------------------------- | -------- | ----------------------- | -------------------------------------------------------- |
| `DATABASE_URL`               | Yes      | —                       | PostgreSQL connection string                             |
| `PORT`                       | No       | `3100`                  | Backend HTTP port                                        |
| `FRONTEND_URL`               | No       | `http://localhost:3000` | Origin allowed by CORS                                   |
| `AI_PROVIDER`                | No       | `openai`                | Agent-planning provider                                  |
| `OPENAI_MODEL`               | No       | `gpt-4o-mini`           | Model used to generate task plans                        |
| `OPENAI_API_KEY`             | No       | —                       | Enables agent-assisted task planning and skill inference |
| `AGENT_PLANNING_TIMEOUT_MS`  | No       | `15000`                 | Provider request timeout in milliseconds                 |
| `SKILL_INFERENCE_TIMEOUT_MS` | No       | `5000`                  | Required-skill inference timeout in milliseconds         |

Without `OPENAI_API_KEY`, agent-assisted task planning (`POST /agent-task`)
stays disabled and returns `AGENT_UNAVAILABLE`, and automatic required-skill
inference on task creation falls back to leaving new tasks untagged. Set
`OPENAI_API_KEY` to enable both; `AI_PROVIDER`/`OPENAI_MODEL`/
`AGENT_PLANNING_TIMEOUT_MS`/`SKILL_INFERENCE_TIMEOUT_MS` all read from the
same key.

Never commit `apps/backend/.env` or share its contents — `OPENAI_API_KEY` is a
live secret. If a key is ever pasted into a chat, log, or ticket, rotate it in
the OpenAI dashboard.

The frontend uses `VITE_API_BASE_URL`, which defaults to
`http://localhost:3100`. Copy `apps/frontend/.env.example` to
`apps/frontend/.env` only when you need to override it.

## Validation commands

```sh
pnpm build
pnpm test
pnpm lint
pnpm check-types
```

`pnpm test` requires PostgreSQL reachable at `DATABASE_URL` (`docker compose up
-d db`, then `pnpm --filter backend db:migrate`) — the backend's integration
tests read and write real tables. Automated tests never call a live LLM
provider: skill inference and agent orchestration are exercised through fakes,
so `pnpm test` passes with or without `OPENAI_API_KEY` set.

Run the live agent-planning verification separately after configuring an OpenAI
API key:

```sh
pnpm --filter backend verify:agent-planning
```

## API

The backend exposes CRUD endpoints for `/tasks`, `/developers`, `/skills`, and
`/categories`, plus `POST /agent-task` for conversational, agent-assisted task
planning. Every response uses the shared `Task`/`Developer`/`Skill`/`Category`
shapes from `packages/shared-types`, and every error uses one consistent
`{ error: { code, message } }` envelope. See the
[backend API contract](docs/contract/backend-api.md) for the full endpoint
list, request/response bodies, and error codes.

## UI ownership

The frontend has four routed pages, each owning one concern:

| Route        | Page             | Owns                                                       |
| ------------ | ---------------- | ---------------------------------------------------------- |
| `/`          | `DashboardPage`  | Summary counts, latest tasks, and setup guidance           |
| `/developer` | `DevelopersPage` | Developer CRUD                                             |
| `/skill`     | `SkillsPage`     | Skill create/read/delete, grouped by category              |
| `/task`      | `TasksPage`      | Task CRUD, nested subtasks, assignment, and the agent flow |

Agent-assisted task creation is a dialog opened from `/task` ("Add task using
agent"), not a separate route. Reusable presentation primitives (buttons,
dialogs, form fields) live in `packages/ui` and are shared with Storybook;
task-, developer-, and skill-specific components stay in
`apps/frontend/src/components`. See
[Frontend Architecture](docs/architecture/frontend.md) for the full data-flow
and state-ownership rules.

## Troubleshooting

- **`ECONNREFUSED` connecting to PostgreSQL** — the `db` container isn't
  running or hasn't finished its health check yet. Run
  `docker compose up -d db` and wait for `docker compose ps` to report
  `healthy` before running migrations or starting the backend.
- **`P3009`/pending migration errors** — run
  `pnpm --filter backend db:migrate` (or, inside Compose, let the `migrator`
  service finish; `backend` waits for `service_completed_successfully`).
- **Port already in use (`3000`, `3100`, `3200`, `5434`, `6006`)** — another
  process (often a previous `pnpm dev` or `docker compose up`) is still
  bound to that port; stop it or override the conflicting port (`PORT` for
  the backend, `-p` on `docker compose up`, or the relevant `--port` flag).
- **"Add task using agent" returns `AGENT_UNAVAILABLE`** — expected without
  `OPENAI_API_KEY` configured in `apps/backend/.env`; manual task creation and
  every other feature are unaffected. Set the key and restart the backend to
  enable it.
- **New tasks are created untagged even with skills omitted** — expected
  fallback when `OPENAI_API_KEY` is unset or inference fails; add the skills
  manually or configure the key and retry.
- **Frontend requests hit the wrong backend** — `VITE_API_BASE_URL` is baked
  into the frontend bundle at build time. Rebuild (`pnpm --filter frontend
build` or `docker compose build frontend`) after changing it; a running
  dev server does not need a rebuild since Vite reads `.env` at start.
- **`docker compose up -d` frontend/backend images are stale after a code
  change** — Compose reuses previously built images. Run
  `docker compose build` (or `docker compose up -d --build`) to rebuild
  before starting.

## Architecture

Turborepo coordinates builds and checks across independently runnable apps. Its
main architectural benefit here is the `@repo/shared-types` workspace: the
backend publishes the same domain models and transport contracts that the
frontend consumes, preventing API type drift without coupling either app to the
other's implementation.

The backend keeps HTTP handlers, business services, and persistence repositories
separate. The frontend keeps API transport, server-state hooks, and presentation
components separate. Agent-generated plans are treated as untrusted output: the
backend reloads the current skill catalog, revalidates every generated ID and
the complete task tree, and only then persists it atomically through
`POST /agent-task` — a plan is either fully created or not created at all.

See the [project documentation](docs/requirements.md),
[architecture overview](docs/architecture/overview.md), and
[backend API contract](docs/contract/backend-api.md) for more detail.
