---
title: Overview
sidebar_position: 1
---

# Overview

## Repository Structure

```text
task-assignment/
├── docker-compose.yml
├── apps/
│   ├── doc/
│   ├── frontend/
│   │   └── Dockerfile
│   └── backend/
│       ├── src/
│       ├── prisma/
│       └── Dockerfile
└── packages/
    ├── shared-types/           # Task, Developer, Category, Skill, and API DTOs
    ├── eslint-config/
    ├── typescript-config/
    └── ui/
```

**Why this target structure:**

- `apps/frontend` and the planned `apps/backend` are independently buildable and runnable.
- The planned `packages/shared-types` is the main payoff of the monorepo: it will provide one source of truth for domain types and API DTOs consumed by both apps.
- `turbo.json` already defines `build`, `lint`, `check-types`, and `dev`. Its `^` dependencies will order shared-package builds before consuming apps once their workspace dependencies exist.

## Tech Stack

| Layer            | Choice                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------- |
| Tooling          | Turborepo + pnpm workspaces                                                            |
| Shared types     | Planned `packages/shared-types`, imported by both apps                                 |
| Frontend         | React + TypeScript (Vite), `apps/frontend`                                             |
| doc              | Docusaurus, `apps/doc`, publishing the root `docs/` tree                               |
| Backend          | Planned Node.js + TypeScript (Fastify), and OpenAPI                                    |
| ORM              | Planned Prisma                                                                         |
| Database         | Planned PostgreSQL                                                                     |
| LLM              | Planned Vercel AI SDK behind a provider-agnostic service                               |
| Containerization | Planned Docker + Docker Compose, with per-app images built from Turborepo prune output |
| Testing          | Planned Vitest/Supertest (backend) and React Testing Library (frontend)                |

## Turborepo Pipeline (`turbo.json`)

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", "build/**"],
    },
    "lint": {
      "dependsOn": ["^lint"],
    },
    "check-types": {
      "dependsOn": ["^check-types"],
    },
    "dev": {
      "cache": false,
      "persistent": true,
    },
  },
}
```

- `^build` will ensure `packages/shared-types` builds before the frontend and backend after those packages declare the dependency.
- `lint` and `check-types` similarly depend on `^lint`/`^check-types` in upstream packages.
- `dev` is uncached/persistent since it's a long-running watch process.

See [Data Model](./data-model.md) for the
`Developer`/`Category`/`Skill`/`Task` schema and the shared TypeScript types.
See [Backend Architecture](./backend.md) for the backend's internal boundaries and request flow.
See [Frontend Architecture](./frontend.md) for frontend boundaries, data flow, and recursive task rendering.
