import "dotenv/config";
import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { disconnectPrisma, prisma } from "./lib/prisma.js";
import { PrismaHealthRepository } from "./lib/repositories/health-repository.js";
import { DefaultHealthService } from "./services/health-service.js";
import { PrismaTaskRepository } from "./lib/repositories/task-repository.js";
import { DefaultTaskService } from "./services/task-service.js";
import { PrismaDeveloperRepository } from "./lib/repositories/developer-repository.js";
import { DefaultDeveloperService } from "./services/developer-service.js";
import { PrismaSkillRepository } from "./lib/repositories/skill-repository.js";
import { DefaultSkillService } from "./services/skill-service.js";
import { PrismaCategoryRepository } from "./lib/repositories/category-repository.js";
import { DefaultCategoryService } from "./services/category-service.js";
import { PrismaTransactionRunner } from "./lib/transaction.js";
import { DefaultAgentTaskService } from "./services/agent-task-service.js";
import {
  NotConfiguredTaskPlanningProvider,
  type TaskPlanningProvider,
} from "./lib/task-planning/task-planning-provider.js";
import {
  OpenAiTaskPlanningProvider,
  isSupportedTaskPlanningProvider,
} from "./lib/task-planning/openai-task-planning-provider.js";
import {
  NotConfiguredSkillInferenceProvider,
  type SkillInferenceProvider,
} from "./lib/skill-inference/skill-inference-provider.js";
import {
  OpenAiSkillInferenceProvider,
  isSupportedSkillInferenceProvider,
} from "./lib/skill-inference/openai-skill-inference-provider.js";
import { DefaultSkillInferenceService } from "./lib/skill-inference/skill-inference-service.js";

const env = loadEnv();

const developerRepository = new PrismaDeveloperRepository(prisma);
const skillRepository = new PrismaSkillRepository(prisma);
const taskRepository = new PrismaTaskRepository(prisma);

const taskPlanningProvider: TaskPlanningProvider =
  env.agentPlanning.apiKey &&
  isSupportedTaskPlanningProvider(env.agentPlanning.provider)
    ? new OpenAiTaskPlanningProvider({
        apiKey: env.agentPlanning.apiKey,
        model: env.agentPlanning.model,
        timeoutMs: env.agentPlanning.timeoutMs,
      })
    : new NotConfiguredTaskPlanningProvider();

const skillInferenceProvider: SkillInferenceProvider =
  env.skillInference.apiKey &&
  isSupportedSkillInferenceProvider(env.skillInference.provider)
    ? new OpenAiSkillInferenceProvider({
        apiKey: env.skillInference.apiKey,
        model: env.skillInference.model,
        timeoutMs: env.skillInference.timeoutMs,
      })
    : new NotConfiguredSkillInferenceProvider();

const app = buildApp({
  healthService: new DefaultHealthService(new PrismaHealthRepository(prisma)),
  taskService: new DefaultTaskService(
    taskRepository,
    developerRepository,
    skillRepository,
    new PrismaTransactionRunner(prisma),
    new DefaultSkillInferenceService(skillInferenceProvider, skillRepository),
  ),
  developerService: new DefaultDeveloperService(developerRepository),
  skillService: new DefaultSkillService(skillRepository),
  categoryService: new DefaultCategoryService(
    new PrismaCategoryRepository(prisma),
  ),
  agentTaskService: new DefaultAgentTaskService(
    taskPlanningProvider,
    skillRepository,
    developerRepository,
    taskRepository,
    new PrismaTransactionRunner(prisma),
  ),
});

async function shutdown(): Promise<void> {
  await app.close();
  await disconnectPrisma();
}

process.once("SIGTERM", () => void shutdown());
process.once("SIGINT", () => void shutdown());

try {
  await app.listen({ port: env.port, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
