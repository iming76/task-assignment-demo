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

const env = loadEnv();

const developerRepository = new PrismaDeveloperRepository(prisma);
const skillRepository = new PrismaSkillRepository(prisma);

const app = buildApp({
  healthService: new DefaultHealthService(new PrismaHealthRepository(prisma)),
  taskService: new DefaultTaskService(
    new PrismaTaskRepository(prisma),
    developerRepository,
    skillRepository,
    new PrismaTransactionRunner(prisma),
  ),
  developerService: new DefaultDeveloperService(developerRepository),
  skillService: new DefaultSkillService(skillRepository),
  categoryService: new DefaultCategoryService(
    new PrismaCategoryRepository(prisma),
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
