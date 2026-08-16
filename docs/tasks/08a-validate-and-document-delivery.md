---
title: 08a — Validate and Document Delivery
sidebar_position: 23
---

# Validate and Document Delivery

OpenSpec change: `validate-and-document-delivery`

## Dependency position

Final change. Starts after [Add Compose Stack](./07b-add-compose-stack.md) and every wave `05`/`06` feature change.

## Outcome

Prove the integrated product from a clean checkout and finish operator/developer documentation.

## Scope

- [ ] Smoke-test resource CRUD, assignment validation, three-level nesting, completion ordering, inference fallback, agent unavailable behavior, and transactional orchestration.
- [ ] Exercise the equivalent browser flows, including filtering, recursion, confirmation, clarification, created staffing gaps, and unavailable state.
- [ ] Run unit, integration, component, architecture, Storybook, build, lint, type-check, and strict OpenSpec validation commands.
- [ ] Verify normal Compose data contains application seed IDs and no test fixture IDs.
- [ ] Update README with layout, rationale, one-command setup, local development, tests, API, environment, architecture, UI ownership, and troubleshooting.
- [ ] Repair documentation links so architecture, contracts, requirements, and numbered tasks agree.

## Acceptance checks

- [ ] A clean-clone evaluator can run and understand the complete system with Docker as the only runtime prerequisite.
- [ ] `openspec validate --all --strict` and every documented quality command pass.

## Out of scope

Cloud hosting, CI/CD deployment, authentication, production secret management, and managed database provisioning.
