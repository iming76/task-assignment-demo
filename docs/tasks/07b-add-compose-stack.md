---
title: 07b — Add Compose Stack
sidebar_position: 22
---

# Add Compose Stack

OpenSpec change: `add-compose-stack`

## Dependency position

Starts after [Add Pruned Container Images](./07a-add-pruned-container-images.md) and [Add Database Seeds](./03a-add-database-seeds.md).

## Outcome

Start PostgreSQL, initialize the database, run the backend, and serve the frontend with one repeatable Docker Compose command.

## Scope

- [ ] Add `db`, `backend`, and `frontend` services, a persistent volume, health checks, and dependency conditions.
- [ ] Pass database and optional provider configuration through environment variables with safe local defaults.
- [ ] Wait for PostgreSQL before applying committed migrations and the idempotent application seed.
- [ ] Start backend/frontend only after dependencies are ready and expose only required ports.
- [ ] Verify repeated startups preserve data without duplicating seeds and that the stack remains usable without an LLM key.

## Acceptance checks

- [ ] `docker compose up --build` works from a clean clone with no host-side pnpm install.
- [ ] Every service becomes healthy and a second startup succeeds against the existing volume.

## Unlocks

[Validate and Document Delivery](./08a-validate-and-document-delivery.md).
