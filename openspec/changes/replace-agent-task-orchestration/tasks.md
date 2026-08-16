## 1. Shared orchestration contracts

- [x] 1.1 Replace proposal/apply DTOs in `packages/shared-types/src/agent-task.ts` with bounded conversation messages, the orchestration request, planned-node internals where shared, clarification and created response variants, and structured staffing gaps.
- [x] 1.2 Update shared-type exports and positive/negative compile fixtures, proving consumers can discriminate outcomes and can no longer import the removed proposal/apply draft contracts.

## 2. Skill catalog discovery and agent decision

- [x] 2.1 Expose and unit-test a read-only tool that returns the complete canonical skill catalog with IDs, names, and descriptions.
- [x] 2.2 Define recursive Zod schemas and bounds for `ask_clarification` and `create_task_tree` decisions, including required roles, canonical skill IDs, unmatched requirements, hierarchy depth, and node count.
- [x] 2.3 Replace the old planning provider with an injectable orchestration provider that runs the AI SDK tool loop, exposes read-only `listSkills`, requires catalog loading before creation, and maps configuration/timeout/tool-loop/provider failures safely.
- [x] 2.4 Rewrite the OpenAI system prompt and provider tests to cover clarification, complete catalog listing, canonical-ID selection, unmatched requirements, malformed output, and exhausted tool steps.

## 3. Transactional orchestration service

- [x] 3.1 Add repository support for deterministic non-`DONE` assignment counts using the active transaction client, with tests for zero, multiple, and tied workloads.
- [x] 3.2 Rewrite `AgentTaskService` around one `orchestrate` operation that validates conversation bounds, loads the current skills for search, and returns clarification without opening a write transaction.
- [x] 3.3 Implement transactional plan revalidation and depth-first tree creation, rejecting unlisted/stale skill IDs and rolling back the complete tree on validation or write failure.
- [x] 3.4 Implement exact-skill assignment ranked by active workload and stable developer ID, incrementing in-request workload after each assignment.
- [x] 3.5 Create unmatched nodes with `assigneeId: null` and assemble persisted task IDs, required roles, canonical skills, and unmatched requirements into staffing-gap response entries.

## 4. Backend API replacement

- [x] 4.1 Replace the contents of `routes/agent-task/routes.ts`, `handlers.ts`, and `schema.ts` with the single `POST /agent-task` contract, returning `200` clarification, `201` creation, and documented validation/provider errors.
- [x] 4.2 Update `app.ts`, `server.ts`, environment/provider composition, and backend test builders to inject and register the orchestration service instead of proposal/apply handlers.
- [x] 4.3 Replace `apps/backend/test/agent-planning-api.test.ts` with integration coverage for conversation validation, no-write clarification, canonical catalog selection, atomic creation, workload assignment, unassigned AI-engineer gaps, rollback, and `AGENT_UNAVAILABLE`.

## 5. Frontend migration

- [x] 5.1 Replace the frontend agent API client and React Query hooks with one non-retrying `orchestrate` mutation using the shared discriminated contract.
- [x] 5.2 Rewrite `AgentTaskPage` to maintain bounded conversation messages, submit clarification follow-ups, render persisted task results, and display structured staffing gaps as successful warnings.
- [x] 5.3 Replace page and client tests to cover initial submission, repeated clarification, created trees, required-role warnings, validation/provider failures, and the absence of an apply request.

## 6. Obsolete-code removal

- [x] 6.1 Delete superseded recursive draft schema/resolution/shape files, old task-planning provider/prompt files, and old fake/provider tests after the orchestration modules are wired.
- [x] 6.2 Delete or rewrite obsolete agent-draft frontend utilities/tests and live planning judge/verification scripts so no proposal/apply or `AgentTaskDraft` references remain.
- [x] 6.3 Remove unused exports, imports, scripts, dependencies, and dead files discovered by repository-wide reference search, while retaining the replaced `routes/agent-task` transport files.

## 7. Documentation and verification

- [x] 7.1 Update `docs/requirements.md`, architecture and security constitutions, backend API contract, frontend architecture, task guides, delivery checks, and other proposal/apply references to document the intentional autonomous-persistence policy change.
- [x] 7.2 Run formatting, lint, shared/backend/frontend type checks, unit and integration tests, and production builds; fix all regressions.
- [x] 7.3 Run an unused-reference search and verify the removed endpoints return `404`, clarification leaves the task store unchanged, creation commits the full hierarchy, and missing qualified developers produce unassigned tasks plus staffing gaps.
- [x] 7.4 Update and run the live-provider verification when credentials are available, recording skill-list tool calls, clarification behavior, canonical skill use, and created staffing-gap output without exposing secrets.
