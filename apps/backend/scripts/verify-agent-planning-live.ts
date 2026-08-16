import "dotenv/config";
import { loadEnv } from "../src/config/env.js";
import { disconnectPrisma, prisma } from "../src/lib/prisma.js";
import { PrismaDeveloperRepository } from "../src/lib/repositories/developer-repository.js";
import { PrismaSkillRepository } from "../src/lib/repositories/skill-repository.js";
import { PrismaTaskRepository } from "../src/lib/repositories/task-repository.js";
import type { AgentOrchestrationProvider } from "../src/lib/agent-orchestration/agent-orchestration-provider.js";
import {
  isSupportedAgentOrchestrationProvider,
  OpenAiAgentOrchestrationProvider,
} from "../src/lib/agent-orchestration/openai-agent-orchestration-provider.js";
import { PrismaTransactionRunner } from "../src/lib/transaction.js";
import { createAgentTaskService } from "../src/services/agent-task-service.js";

const SAMPLE_MESSAGES = [
  {
    role: "user" as const,
    content:
      "Create a profile-image moderation feature that uses AI to detect unsafe uploads.",
  },
  {
    role: "assistant" as const,
    content:
      "What specific unsafe content types should the AI detect in profile images?",
  },
  {
    role: "user" as const,
    content:
      "Detect nudity, graphic violence, and hate symbols. Support JPEG, PNG, and WebP uploads.",
  },
];

async function main(): Promise<void> {
  const env = loadEnv();
  if (!env.agentPlanning.apiKey) {
    console.error("OPENAI_API_KEY is not set; live verification was not run.");
    process.exitCode = 1;
    return;
  }
  if (!isSupportedAgentOrchestrationProvider(env.agentPlanning.provider)) {
    console.error(`Unsupported AI_PROVIDER: ${env.agentPlanning.provider}`);
    process.exitCode = 1;
    return;
  }

  const skillRepository = new PrismaSkillRepository(prisma);
  const taskRepository = new PrismaTaskRepository(prisma);
  const openAiProvider = new OpenAiAgentOrchestrationProvider({
    apiKey: env.agentPlanning.apiKey,
    model: env.agentPlanning.model,
    timeoutMs: Math.max(env.agentPlanning.timeoutMs, 60_000),
  });
  const provider: AgentOrchestrationProvider = {
    async decide(context) {
      const result = await openAiProvider.decide(context);
      console.log(
        `Canonical skill catalog listed: ${result.skillCatalogListed}; catalog size: ${context.skills.length}`,
      );
      return result;
    },
  };
  const service = createAgentTaskService(
    provider,
    skillRepository,
    new PrismaDeveloperRepository(prisma),
    taskRepository,
    new PrismaTransactionRunner(prisma),
  );

  console.log("Calling live OpenAI-backed orchestration.");
  console.log("Warning: a created outcome writes ordinary task records.");
  const response = await service.orchestrate({
    messages: SAMPLE_MESSAGES,
  });
  console.log(JSON.stringify(response, null, 2));
  if (response.status !== "created") {
    throw new Error(
      "Expected a created outcome after supplying clarification.",
    );
  }
  for (const task of [...response.tasks].reverse()) {
    await taskRepository.delete(task.id);
  }
  console.log(`Removed ${response.tasks.length} live-verification tasks.`);
}

main()
  .catch((error: unknown) => {
    console.error("verify-agent-planning-live failed:", describeError(error));
    process.exitCode = 1;
  })
  .finally(() => void disconnectPrisma());

function describeError(error: unknown): string {
  const messages: string[] = [];
  let current = error;
  while (current instanceof Error) {
    messages.push(`${current.name}: ${current.message}`);
    current = current.cause;
  }
  return messages.join(" <- ");
}
