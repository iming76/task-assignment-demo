---
title: Coding Standards
sidebar_position: 2
---

# Coding Standards

## Formatting and linting

Prettier (default configuration) formats TypeScript, JSX, and Markdown: the
root `format` script runs
`prettier --write "**/*.{ts,tsx,md}"`. ESLint is the package-level linter run
by each application's `lint` script (`eslint . --max-warnings 0`), using the
shared `@repo/eslint-config` presets.

`lint-staged` (configured in the root `package.json`) runs on every Husky
pre-commit hook: staged files under `packages/ui/**/*.{js,jsx,ts,tsx}` are
fixed with `eslint --fix`, and every staged `.{js,jsx,ts,tsx,json,md,mdx,yml,yaml,css}`
file is formatted with `prettier --write`. This fast staged check complements
the package-level `lint`/`check-types` commands; both must pass for changed
application code.

## TypeScript

Strict mode throughout. Types for `Task`, `Developer`, `Category`, `Skill`,
and API DTOs live once in `packages/shared-types` and are imported, never
redeclared — see
[Architecture](./architecture.md#shared-types-is-the-single-source-of-truth).

## Monorepo tooling

pnpm workspaces (`pnpm-workspace.yaml`) plus Turborepo (`turbo.json`) handle task orchestration. `build`, `dev`, `test`, `lint`, and `check-types` run through `turbo run <task>` from the root `package.json`. Apps that depend on `packages/shared-types` and `packages/ui` get those built first via `turbo.json`'s `^` task dependencies.

## Commit messages

Enforced by `commitlint.config.js` via a Husky `commit-msg` hook, using a custom header pattern rather than plain conventional commits:

```
type[scope]: subject
```

- `type` — one of `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `build`, `ci`, `revert`
- `scope` — one of `spec`, `backend`, `frontend`, `shared-types`, `ui`, `infra`, `others`, `docs`, `setup` (required, not optional)
- `subject` — required, header capped at 100 characters

Example: `feat[backend]: enforce assignment rule on PATCH /tasks/:id`.
