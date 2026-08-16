# Task Assignment Demo

A full-stack task assignment application for organizing nested work, matching
developers to the skills a task requires, and reviewing AI-generated task plans
before they are saved.

The repository is a pnpm/Turborepo monorepo. Shared domain and API types live in
one package so the React frontend and Fastify backend use the same contracts.

## Features

- Create and manage tasks, subtasks, developers, skills, and skill categories.
- Assign only developers whose skills satisfy a task's requirements.
- Track task completion while enforcing parent/subtask completion rules.
- Generate recursive task proposals with an LLM, review them, and apply them in
  a validated transaction.
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

### Running the full stack with Docker Compose

`docker-compose.yml` also defines `migrator`, `backend`, and `frontend`
services that build production images from `apps/backend/Dockerfile` and
`apps/frontend/Dockerfile`. Bring up the whole application, including the
database, migrations, and both apps, with:

```sh
docker compose up -d
```

The `migrator` service applies Prisma migrations and exits before `backend`
starts. Pass build-time secrets such as `OPENAI_API_KEY` as environment
variables on the host, or in a `.env` file next to `docker-compose.yml`, since
they are forwarded to the `backend` service. The frontend image is built with
`VITE_API_BASE_URL` baked in at build time, so rebuild it (`docker compose
build frontend`) if the backend's reachable origin changes.

## Configuration

Backend settings are read from `apps/backend/.env`:

| Variable                     | Required | Default                 | Purpose                                                 |
| ---------------------------- | -------- | ----------------------- | ------------------------------------------------------- |
| `DATABASE_URL`               | Yes      | —                       | PostgreSQL connection string                            |
| `PORT`                       | No       | `3100`                  | Backend HTTP port                                       |
| `FRONTEND_URL`               | No       | `http://localhost:3000` | Origin allowed by CORS                                  |
| `AI_PROVIDER`                | No       | `openai`                | Agent-planning provider                                 |
| `OPENAI_MODEL`               | No       | `gpt-4o-mini`           | Model used to generate task plans                       |
| `OPENAI_API_KEY`             | Yes      | —                       | Required for AI task-plan proposals and skill inference |
| `AGENT_PLANNING_TIMEOUT_MS`  | No       | `15000`                 | Provider request timeout in milliseconds                |
| `SKILL_INFERENCE_TIMEOUT_MS` | No       | `5000`                  | Required-skill inference timeout in milliseconds        |

Without `OPENAI_API_KEY`, agent-assisted task planning stays disabled and
returns `AGENT_UNAVAILABLE` (applying an already reviewed proposal is
unaffected), and automatic required-skill inference on task creation falls
back to leaving new tasks untagged. Set `OPENAI_API_KEY` to enable both;
`AI_PROVIDER`/`OPENAI_MODEL`/`AGENT_PLANNING_TIMEOUT_MS`/
`SKILL_INFERENCE_TIMEOUT_MS` all read from the same key.

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

Run the live agent-planning verification separately after configuring an OpenAI
API key:

```sh
pnpm --filter backend verify:agent-planning
```

## Architecture

Turborepo coordinates builds and checks across independently runnable apps. Its
main architectural benefit here is the `@repo/shared-types` workspace: the
backend publishes the same domain models and transport contracts that the
frontend consumes, preventing API type drift without coupling either app to the
other's implementation.

The backend keeps HTTP handlers, business services, and persistence repositories
separate. The frontend keeps API transport, server-state hooks, and presentation
components separate. Agent-generated plans are treated as untrusted drafts:
users review them first, and the backend revalidates the complete tree before a
transactional write.

See the [project documentation](docs/requirements.md),
[architecture overview](docs/architecture/overview.md), and
[backend API contract](docs/contract/backend-api.md) for more detail.
