---
title: 07a — Add Pruned Container Images
sidebar_position: 21
---

# Add Pruned Container Images

OpenSpec change: `add-pruned-container-images`

## Dependency position

Starts after the backend and frontend production builds exist: all wave `05` tasks plus both wave `06` tasks.

## Outcome

Build minimal production backend and frontend images from Turborepo-pruned workspaces.

## Scope

- [ ] Add a root `.dockerignore` excluding metadata, dependencies, caches, output, secrets, and local database data.
- [ ] Add a backend multi-stage Dockerfile using `turbo prune backend --docker`, frozen pnpm install, build, and non-root runtime.
- [ ] Separate backend migration/seed initialization from the long-running server command.
- [ ] Add a frontend multi-stage Dockerfile using `turbo prune frontend --docker`, Vite build, and nginx runtime.
- [ ] Add SPA fallback and backend reachability without hard-coded browser localhost assumptions.
- [ ] Add health checks and verify final images omit the unpruned repo, caches, secrets, and Storybook output.

## Acceptance checks

- [ ] Both images build from a clean clone using only declared lockfile dependencies.
- [ ] The frontend runtime contains static app assets but no Storybook tooling.

## Unlocks

[Add Compose Stack](./07b-add-compose-stack.md).
