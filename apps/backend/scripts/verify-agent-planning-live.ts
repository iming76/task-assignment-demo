import "dotenv/config";
import { createOpenAI } from "@ai-sdk/openai";
import { loadEnv } from "../src/config/env.js";
import { disconnectPrisma, prisma } from "../src/lib/prisma.js";
import { PrismaDeveloperRepository } from "../src/lib/repositories/developer-repository.js";
import { PrismaSkillRepository } from "../src/lib/repositories/skill-repository.js";
import { PrismaTaskRepository } from "../src/lib/repositories/task-repository.js";
import {
  isSupportedTaskPlanningProvider,
  OpenAiTaskPlanningProvider,
} from "../src/lib/task-planning/openai-task-planning-provider.js";
import { PrismaTransactionRunner } from "../src/lib/transaction.js";
import { DefaultAgentTaskService } from "../src/services/agent-task-service.js";
import { judgeAgentPlan } from "./judge-agent-plan.js";

/**
 * Manual, on-demand smoke check for the real OpenAI-backed planning
 * provider. Never run in CI or `pnpm test` — it costs real API usage and
 * needs a live OPENAI_API_KEY. See openspec/changes/verify-agent-planning-live.
 *
 * Run with: pnpm --filter backend run verify:agent-planning
 */
const SAMPLE_DESCRIPTION =
  "Build a task assignment system with a React frontend and a Fastify API, including developer skill matching.";

async function main(): Promise<void> {
  const env = loadEnv();

  if (!env.agentPlanning.apiKey) {
    console.error(
      "OPENAI_API_KEY is not set. Set it in apps/backend/.env before running this script — see .env.example.",
    );
    process.exitCode = 1;
    return;
  }
  if (!isSupportedTaskPlanningProvider(env.agentPlanning.provider)) {
    console.error(
      `AI_PROVIDER="${env.agentPlanning.provider}" is not supported by this script (only "openai" is wired up).`,
    );
    process.exitCode = 1;
    return;
  }

  const skillRepository = new PrismaSkillRepository(prisma);
  const developerRepository = new PrismaDeveloperRepository(prisma);
  const taskRepository = new PrismaTaskRepository(prisma);
  const provider = new OpenAiTaskPlanningProvider({
    apiKey: env.agentPlanning.apiKey,
    model: env.agentPlanning.model,
    timeoutMs: env.agentPlanning.timeoutMs,
  });
  const agentTaskService = new DefaultAgentTaskService(
    provider,
    skillRepository,
    developerRepository,
    taskRepository,
    new PrismaTransactionRunner(prisma),
  );

  console.log(`Description: ${SAMPLE_DESCRIPTION}\n`);
  console.log("Calling live OpenAI-backed propose()...\n");

  const { tasks } = await agentTaskService.propose({
    description: SAMPLE_DESCRIPTION,
  });

  console.log("Generated draft:\n");
  console.log(JSON.stringify(tasks, null, 2));

  console.log("\nRunning LLM-as-judge check...\n");
  const judgeProvider = createOpenAI({ apiKey: env.agentPlanning.apiKey });
  const judgment = await judgeAgentPlan({
    model: judgeProvider(env.agentPlanning.model),
    description: SAMPLE_DESCRIPTION,
    tasks,
  });

  console.log(`Judge verdict: ${judgment.pass ? "PASS" : "FAIL"}`);
  console.log(`Reasoning: ${judgment.reasoning}`);

  if (!judgment.pass) {
    process.exitCode = 1;
  }
}

main()
  .catch((error: unknown) => {
    console.error("verify-agent-planning-live failed:", error);
    process.exitCode = 1;
  })
  .finally(() => void disconnectPrisma());
