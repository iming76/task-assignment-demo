---
title: 02c — Add Frontend Application Shell
sidebar_position: 7
---

# Add Frontend Application Shell

OpenSpec change: `add-frontend-application-shell`

## Dependency position

Starts after [Add Shared UI System](./01c-add-shared-ui-system.md).

## Outcome

Create the Vite/React application shell, routing, navigation, and route-level state frames without connecting product APIs.

## Scope

- [ ] Scaffold `apps/frontend` with strict TypeScript and Turborepo-compatible scripts.
- [ ] Mount one `BrowserRouter`, keep routes in `App.tsx`, and navigation labels/paths in configuration.
- [ ] Add `/`, `/developer`, `/skill`, `/task`, and `/agent-task` route shells using `@repo/ui` primitives.
- [ ] Add consistent loading, empty, error, and not-found presentation patterns.
- [ ] Add router and navigation tests, including no full-page reloads.

## Acceptance checks

- [ ] Frontend build, lint, type-check, and shell tests pass without the backend.
- [ ] No public API/domain contracts are redeclared and no network behavior is added.

## Unlocks

[Add Frontend API Client](./03c-add-frontend-api-client.md).
