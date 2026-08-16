## Context

`apps/backend/src/lib/task-planning/openai-task-planning-provider.ts` calls
the real OpenAI API through the AI SDK's `generateText` + `Output.object`.
Automated tests (`apps/backend/test/**`) mock this provider entirely and run
under `vitest run` / CI, per `docs/architecture/backend.md`'s "LLM provider
calls are mocked in automated tests." This script is the first thing to
actually exercise the live provider. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**

- A single command that proves `OPENAI_API_KEY` + `OpenAiTaskPlanningProvider`
  actually produce a usable plan for a realistic description.
- An automated pass/fail signal (LLM-as-judge), not just "did it not throw."

**Non-Goals:**

- Running in CI or as part of `pnpm test` / `turbo run test` — it costs real
  API usage and depends on network + a live key, which automated tests must
  not require.
- Exhaustively evaluating provider quality (prompt tuning, model comparison).
  One representative scenario is enough to catch integration breakage.

## Decisions

1. **Location: `apps/backend/scripts/verify-agent-planning-live.ts`, run via `tsx`.**
   Kept out of `apps/backend/test/` so `vitest run`'s `include: ["test/**/*.test.ts"]`
   (see `apps/backend/vitest.config.ts`) never picks it up, and out of CI's
   `turbo run test` pipeline entirely. Alternative considered: a
   `*.live.test.ts` file with a vitest `include` opt-in — rejected because it's
   easy to accidentally wire into the default test run later, and this isn't a
   test-runner-shaped need (no assertions-as-spec, just a pass/fail report).

2. **Build the plan through the real service, not just the provider.**
   Construct `DefaultAgentTaskService` with `OpenAiTaskPlanningProvider` plus
   real `SkillRepository`/`DeveloperRepository` (reading the current DB, same
   as `server.ts`) and call `.propose(...)`. This exercises the full path
   (catalog fetch → provider call → shape/eligibility validation) the same way
   the real endpoint does, not just a raw provider call.

3. **LLM-as-judge: a second `generateText` call, structured output, fixed rubric.**
   Reuse the already-installed `ai` + `@ai-sdk/openai` and the same
   `Output.object` pattern as the provider itself. The judge receives the
   original description and the generated `AgentTaskDraft[]` (JSON) and
   returns `{ pass: boolean, reasoning: string }` against a fixed rubric:
   tasks are relevant to the description, the tree is sensibly decomposed
   (not a single flat task, not absurdly over-nested), and no field is empty
   where the schema already guarantees non-empty. (Catalog-id validity is
   already guaranteed by `DefaultAgentTaskService` itself, so the judge isn't
   asked to re-check that.) The prompt lives in
   `apps/backend/scripts/prompts/judge-agent-plan-prompt.ts`, matching the
   existing `lib/task-planning/prompts/` convention.

4. **Fail fast and loud when misconfigured.**
   If `OPENAI_API_KEY` is unset, the script exits with a clear message before
   attempting any network call, rather than silently exercising
   `NotConfiguredTaskPlanningProvider` (which would defeat the point).

## Risks / Trade-offs

- [Live call is non-deterministic; a good plan could occasionally get judged
  "fail"] → Print the full draft and judge reasoning on failure so a human can
  eyeball it; treat this as a smoke check to run manually, not a CI gate.
- [Costs real API usage every run] → One short description, one proposal call,
  one judge call per run; documented in the script's own `--help`/comment as a
  manual, on-demand tool.
