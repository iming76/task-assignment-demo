---
title: Coding Standards
sidebar_position: 2
---

# Coding Standards

## Formatting and linting

[Biome](https://biomejs.dev) (`biome.json`) is the formatter and staged-file checker for TypeScript, JavaScript, JSON, and CSS: 2-space indentation, double-quote strings, the `recommended` rule preset, and `organizeImports` on. ESLint remains the package-level linter run by each application's `lint` script. Prettier is scoped narrowly to Markdown — the root `format` script runs `prettier --write "**/*.md"`; TypeScript formatting goes through Biome instead.

`lint-staged` runs `biome check --write --no-errors-on-unmatched` on staged `.{js,jsx,ts,tsx,json,jsonc,css}` files via a Husky pre-commit hook. This fast staged check complements the package-level ESLint commands; both must pass for changed application code.

## TypeScript

Strict mode throughout. When the planned `packages/shared-types` lands, types
for `Task`, `Developer`, `Category`, `Skill`, and API DTOs must live there once
and be imported, never redeclared — see
[Architecture](./architecture.md#shared-types-is-the-single-source-of-truth).

## Monorepo tooling

pnpm workspaces (`pnpm-workspace.yaml`) plus Turborepo (`turbo.json`) handle task orchestration. `build`, `dev`, `lint`, and `check-types` run through `turbo run <task>` from the root `package.json`. Once apps depend on the planned shared-types package, the existing `^` task dependencies will run that package first.

## Commit messages

Enforced by `commitlint.config.js` via a Husky `commit-msg` hook, using a custom header pattern rather than plain conventional commits:

```
type[scope]: subject
```

- `type` — one of `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `build`, `ci`, `revert`
- `scope` — one of `spec`, `backend`, `frontend`, `shared-types`, `ui`, `infra`, `others`, `docs`, `setup` (required, not optional)
- `subject` — required, header capped at 100 characters

Example: `feat[backend]: enforce assignment rule on PATCH /tasks/:id`.
