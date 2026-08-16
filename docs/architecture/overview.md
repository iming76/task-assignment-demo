---
title: Overview
sidebar_position: 1
---

# Overview

## Repository Structure

```text
task-assignment-demo/
├── docker-compose.yml
├── apps/
│   ├── doc/                    # Docusaurus site publishing docs/
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
    └── ui/                     # Shared UI components and Storybook stories
```

**Why this structure:**

- `apps/frontend` and `apps/backend` are independently buildable and runnable.
- `packages/shared-types` is the main payoff of the monorepo: both apps import
  the same `Task`/`Developer`/`Category`/`Skill`/DTO definitions, so the
  frontend and backend can never drift into incompatible request/response
  shapes.
- `turbo.json` defines `build`, `lint`, `check-types`, `test`, and `dev`. Its
  `^` dependencies order `packages/shared-types` and `packages/ui` builds
  before the apps that consume them.

## Tech Stack

| Layer            | Choice                                                                         |
| ---------------- | ------------------------------------------------------------------------------ |
| Tooling          | Turborepo + pnpm workspaces                                                    |
| Shared types     | `packages/shared-types`, imported by both apps                                 |
| Frontend         | React 19 + TypeScript (Vite), TanStack Query, Tailwind CSS, shadcn/ui          |
| Docs             | Docusaurus, `apps/doc`, publishing the root `docs/` tree                       |
| Backend          | Node.js + TypeScript (Fastify)                                                 |
| ORM              | Prisma                                                                         |
| Database         | PostgreSQL 16                                                                  |
| LLM              | Vercel AI SDK with an OpenAI provider, behind an injectable provider port      |
| Containerization | Docker + Docker Compose, with per-app images built from Turborepo prune output |
| Testing          | Vitest/Supertest (backend) and Vitest/React Testing Library (frontend)         |

## Local Development Ports

| Service    | Port   | Local URL               |
| ---------- | ------ | ----------------------- |
| Frontend   | `3000` | `http://localhost:3000` |
| Backend    | `3100` | `http://localhost:3100` |
| Docs       | `3200` | `http://localhost:3200` |
| Storybook  | `6006` | `http://localhost:6006` |
| PostgreSQL | `5434` | `localhost:5434`        |

## Turborepo Pipeline (`turbo.json`)

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "globalEnv": [
    "NODE_ENV",
    "DATABASE_URL",
    "PORT",
    "FRONTEND_URL",
    "VITE_API_BASE_URL",
    "AI_PROVIDER",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "AGENT_PLANNING_TIMEOUT_MS",
    "SKILL_INFERENCE_TIMEOUT_MS",
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": [
        ".next/**",
        "!.next/cache/**",
        "!.next/dev/**",
        "build/**",
        "dist/**",
      ],
    },
    "lint": {
      "dependsOn": ["^lint"],
    },
    "check-types": {
      "dependsOn": ["^check-types", "^build"],
    },
    "check-architecture": {},
    "test": {
      "dependsOn": ["^build"],
    },
    "dev": {
      "cache": false,
      "persistent": true,
    },
  },
}
```

- `^build` ensures `packages/shared-types` and `packages/ui` build before the
  frontend and backend that depend on them.
- `lint`, `check-types`, and `test` similarly depend on their upstream
  package equivalents so type errors and build output stay current.
- `dev` is uncached/persistent since it's a long-running watch process.

See [Data Model](./data-model.md) for the
`Developer`/`Category`/`Skill`/`Task` schema and the shared TypeScript types.
See [Backend Architecture](./backend.md) for the backend's internal boundaries and request flow.
See [Frontend Architecture](./frontend.md) for frontend boundaries, data flow, and recursive task rendering.
