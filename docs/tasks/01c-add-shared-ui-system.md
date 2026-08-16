---
title: 01c — Add Shared UI System
sidebar_position: 4
---

# Add Shared UI System

OpenSpec change: `add-shared-ui-system`

## Dependency position

Root change. Start this immediately, in parallel with the other `01` plans.

## Outcome

Turn `packages/ui` into the repository-owned shadcn/ui primitive library and document it with Storybook.

## Scope

- [ ] Configure shadcn/ui, Tailwind/theme tokens, `components.json`, and the shared `cn` utility in `packages/ui`.
- [ ] Add only the needed accessible primitives: buttons, inputs, labels, selects, form feedback, cards, badges, and alert-dialog confirmation.
- [ ] Export all primitives through `@repo/ui`; keep product-specific compositions out of the package.
- [ ] Configure React/Vite Storybook and add stories for variants, loading, errors, keyboard interaction, and supported color modes.
- [ ] Add deterministic package build, lint, type-check, static Storybook, interaction, and accessibility commands.

## Acceptance checks

- [ ] `@repo/ui` is consumable without source-path imports.
- [ ] Static Storybook checks run without a backend or LLM provider.

## Unlocks

[Add Frontend Application Shell](./02c-add-frontend-application-shell.md).
