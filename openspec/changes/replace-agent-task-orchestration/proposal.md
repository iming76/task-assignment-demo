## Why

The current agent-task API requires a write-free proposal followed by a separate reviewed apply, while the desired experience is a single conversational operation that discovers canonical skills, asks for missing information when necessary, and otherwise creates and assigns the task tree. Skill discovery must remain grounded in stored skill names and descriptions, and a missing qualified developer must be reported as a staffing gap rather than blocking creation.

## What Changes

- **BREAKING** Replace `POST /agent-task/proposals` and `POST /agent-task/apply` with one `POST /agent-task` orchestration endpoint.
- Require the planning agent to load the complete canonical skill list, including names and descriptions, through a read-only backend tool before selecting skill IDs.
- Return a typed clarification response without writing tasks when the request lacks information needed for a valid plan.
- For a complete request, validate the generated recursive plan against current catalog data, select qualified developers using exact required-skill coverage and deterministic availability ranking, and create the complete tree atomically.
- Create valid tasks and subtasks with `assigneeId: null` when no relevant developer is available, and return structured staffing gaps with a human-readable required role such as `AI Engineer`.
- Keep LLM output untrusted: the model may select only canonical skill IDs returned by search, while the backend owns validation, assignment, transactionality, and persistence.
- Replace the agent-task shared request/response DTOs, client calls, and UI states to support clarification, created tasks, and staffing-gap outcomes.
- Remove the obsolete proposal/apply handlers, schemas, draft utilities, provider abstractions, tests, verification code, and other files that are no longer referenced after the replacement flow is wired end to end.
- Update architecture, security, API-contract, requirements, and delivery documentation that currently mandates explicit review-before-persistence.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `agent-planning-api`: Replace the reviewed proposal/apply lifecycle with canonical skill-catalog discovery, clarification-or-creation orchestration, transactional task-tree creation, deterministic assignment, and non-blocking staffing gaps.
- `shared-api-contracts`: Replace the proposal/apply DTOs with a discriminated request/response contract for clarification and created task-tree outcomes.
- `agent-planning-ui`: Replace draft review/apply behavior with a conversational submission flow that displays clarification prompts, created tasks, and unassigned-role warnings.

## Impact

- Backend route, schema, handler, service, composition-root, AI-provider, catalog-tool, repository, transaction, and error-mapping code under `apps/backend`.
- Shared agent-task types and compile-time fixtures under `packages/shared-types`.
- Frontend API client, hooks, agent-task page, local draft utilities, and tests under `apps/frontend`.
- Existing proposal/apply consumers receive a breaking API change and must migrate to `POST /agent-task`.
- Agent planning tests and live verification scripts must be replaced to exercise tool-based skill discovery, clarification, atomic creation, assignment ranking, and staffing gaps.
- Documentation currently treats immediate persistence as a non-goal and must be reconciled explicitly with the new product decision.
