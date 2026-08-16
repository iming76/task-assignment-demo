import "dotenv/config";
import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { disconnectPrisma, prisma } from "./lib/prisma.js";
import { PrismaHealthRepository } from "./lib/repositories/health-repository.js";
import { createHealthService } from "./services/health-service.js";
import { PrismaTaskRepository } from "./lib/repositories/task-repository.js";
import { createTaskService } from "./services/task-service.js";
import { PrismaDeveloperRepository } from "./lib/repositories/developer-repository.js";
import { createDeveloperService } from "./services/developer-service.js";
import { PrismaSkillRepository } from "./lib/repositories/skill-repository.js";
import { createSkillService } from "./services/skill-service.js";
import { PrismaCategoryRepository } from "./lib/repositories/category-repository.js";
import { createCategoryService } from "./services/category-service.js";
import { PrismaTransactionRunner } from "./lib/transaction.js";
import { createAgentTaskService } from "./services/agent-task-service.js";
import {
  NotConfiguredAgentOrchestrationProvider,
  type AgentOrchestrationProvider,
} from "./lib/agent-orchestration/agent-orchestration-provider.js";
import {
  OpenAiAgentOrchestrationProvider,
  isSupportedAgentOrchestrationProvider,
} from "./lib/agent-orchestration/openai-agent-orchestration-provider.js";
import {
  NotConfiguredSkillInferenceProvider,
  type SkillInferenceProvider,
} from "./lib/skill-inference/skill-inference-provider.js";
import {
  OpenAiSkillInferenceProvider,
  isSupportedSkillInferenceProvider,
} from "./lib/skill-inference/openai-skill-inference-provider.js";
import { DefaultSkillInferenceService } from "./lib/skill-inference/skill-inference-service.js";
import { seedDatabaseIfEmpty } from "../prisma/seeds/seed.js";

const env = loadEnv();

const developerRepository = new PrismaDeveloperRepository(prisma);
const skillRepository = new PrismaSkillRepository(prisma);
const taskRepository = new PrismaTaskRepository(prisma);

const agentOrchestrationProvider: AgentOrchestrationProvider =
  env.agentPlanning.apiKey &&
  isSupportedAgentOrchestrationProvider(env.agentPlanning.provider)
    ? new OpenAiAgentOrchestrationProvider({
        apiKey: env.agentPlanning.apiKey,
        model: env.agentPlanning.model,
        timeoutMs: env.agentPlanning.timeoutMs,
      })
    : new NotConfiguredAgentOrchestrationProvider();

const skillInferenceProvider: SkillInferenceProvider =
  env.skillInference.apiKey &&
  isSupportedSkillInferenceProvider(env.skillInference.provider)
    ? new OpenAiSkillInferenceProvider({
        apiKey: env.skillInference.apiKey,
        model: env.skillInference.model,
        timeoutMs: env.skillInference.timeoutMs,
      })
    : new NotConfiguredSkillInferenceProvider();

const app = buildApp(
  {
    healthService: createHealthService(new PrismaHealthRepository(prisma)),
    taskService: createTaskService(
      taskRepository,
      developerRepository,
      skillRepository,
      new PrismaTransactionRunner(prisma),
      new DefaultSkillInferenceService(skillInferenceProvider, skillRepository),
    ),
    developerService: createDeveloperService(developerRepository),
    skillService: createSkillService(skillRepository),
    categoryService: createCategoryService(
      new PrismaCategoryRepository(prisma),
    ),
    agentTaskService: createAgentTaskService(
      agentOrchestrationProvider,
      skillRepository,
      developerRepository,
      taskRepository,
      new PrismaTransactionRunner(prisma),
    ),
  },
  { corsOrigin: env.corsOrigin },
);

async function shutdown(): Promise<void> {
  await app.close();
  await disconnectPrisma();
}

process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());

try {
  const wasSeeded = await seedDatabaseIfEmpty(prisma);
  if (wasSeeded) {
    app.log.info("Database was empty; initial seed data created.");
  }

  await app.listen({ port: env.port, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
