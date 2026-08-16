## Why

`add-agent-planning-api` was implemented and archived using a fully mocked
`TaskPlanningProvider` (per `docs/architecture/backend.md`: "LLM provider
calls are mocked in automated tests"), so nothing has yet exercised the real
`OpenAiTaskPlanningProvider` against the live OpenAI API. A local `.env`
already has a working `OPENAI_API_KEY`. We need a one-off way to confirm the
live integration actually produces a usable plan before trusting it, without
adding real network calls to the automated (CI) test suite.

## What Changes

- Add a standalone verification script that starts the backend with the real
  `OpenAiTaskPlanningProvider` (reading `.env`), sends a real
  `POST /agent-task/proposals` request with a sample project description, and
  prints the resulting draft.
- Add an "LLM as judge" check: a second live call (same provider/model) that
  scores the generated draft against the request's description and the
  `AgentTaskDraft` contract (only catalog ids, sane task breakdown, no
  hallucinated skills/developers), and reports pass/fail with the reasoning.
- Document how to run the script (`pnpm --filter backend run verify:agent-planning`
  or similar) and that it costs real API usage and is never run in CI.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

This is a dev/verification script, not a product-behavior change — the
`agent-planning-api` capability's contract (write-free proposals, mocked in
automated tests) is unchanged. `skip_specs: true` is set in `.openspec.yaml`.

## Impact

- New file(s) under `apps/backend/scripts/` (or `apps/backend/test/live/`,
  excluded from the normal `vitest run`).
- A new `package.json` script in `apps/backend`.
- No changes to production code, routes, or the documented API contract.
- Requires `OPENAI_API_KEY` (and friends) to be set locally; the script must
  fail fast with a clear message if it isn't.
