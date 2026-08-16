## Context

The shared UI primitives can support a frontend, but product routing and API behavior should remain separate slices. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- A backend-independent React/Vite shell with one router and consistent route states.

**Non-Goals:**

- Network clients or product CRUD behavior.

## Decisions

1. Keep BrowserRouter ownership in main.tsx and route configuration in App.tsx, with navigation metadata in one config module. Scattered routers were rejected because they break composition and tests.
2. Represent loading, empty, error, and not-found states with shared compositions. Route-specific duplicate frames were rejected.

## Risks / Trade-offs

- [Later routes may need different layouts] → keep route frames composable rather than embedding product data assumptions.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
