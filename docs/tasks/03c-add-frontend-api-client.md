---
title: 03c — Add Frontend API Client
sidebar_position: 10
---

# Add Frontend API Client

OpenSpec change: `add-frontend-api-client`

## Dependency position

Starts after [Add Shared API Contracts](./02b-add-shared-api-contracts.md) and [Add Frontend Application Shell](./02c-add-frontend-application-shell.md).

## Outcome

Create one typed browser API boundary for resource CRUD and agent orchestration calls.

## Scope

- [ ] Add `@repo/shared-types` as a frontend workspace dependency.
- [ ] Implement a small client for task, developer, category, skill, and agent endpoints.
- [ ] Configure the backend base URL through Vite environment variables.
- [ ] Preserve optional-field semantics when serializing requests.
- [ ] Parse the public error envelope into safe, actionable UI errors.
- [ ] Test URLs, methods, payloads, responses, network failures, and error mapping with mocked HTTP.

## Acceptance checks

- [ ] All public request/response types are imported from `@repo/shared-types`.
- [ ] The client contains no UI components, provider credentials, or LLM calls.

## Unlocks

Frontend feature work in waves `05` and `06`.
