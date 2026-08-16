## 1. Script scaffolding

- [x] 1.1 Add `apps/backend/scripts/verify-agent-planning-live.ts`: load `.env`, fail fast with a clear message if `OPENAI_API_KEY` is unset
- [x] 1.2 Wire up real repositories/services the same way `server.ts` does (Prisma-backed `SkillRepository`/`DeveloperRepository`, `OpenAiTaskPlanningProvider`, `DefaultAgentTaskService`)
- [x] 1.3 Add a `verify:agent-planning` script to `apps/backend/package.json` running the script via `tsx`

## 2. Live proposal call

- [x] 2.1 Call `agentTaskService.propose(...)` with one realistic sample project description
- [x] 2.2 Print the generated `AgentTaskDraft[]` (pretty JSON) to stdout

## 3. LLM-as-judge check

- [x] 3.1 Add `apps/backend/scripts/prompts/judge-agent-plan-prompt.ts` with the fixed rubric from design.md
- [x] 3.2 Add a judge call using `generateText` + `Output.object` (zod schema: `{ pass: boolean, reasoning: string }`) over the description + generated draft
- [x] 3.3 Print the judge's pass/fail and reasoning; exit non-zero on `pass: false` or any thrown error

## 4. Manual verification

- [x] 4.1 Run `pnpm --filter backend run verify:agent-planning` against the live API and confirm it prints a coherent draft and a `pass: true` judgment
- [x] 4.2 Temporarily unset `OPENAI_API_KEY` and confirm the script fails fast with the clear configuration error, not a raw provider/network error
