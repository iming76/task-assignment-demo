import "dotenv/config";
import { buildApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { disconnectPrisma, prisma } from "./lib/prisma.js";
import { PrismaHealthRepository } from "./lib/repositories/health-repository.js";
import { DefaultHealthService } from "./services/health-service.js";

const env = loadEnv();

const app = buildApp({
  healthService: new DefaultHealthService(new PrismaHealthRepository(prisma)),
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
