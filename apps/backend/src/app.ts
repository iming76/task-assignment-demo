import Fastify, { type FastifyInstance } from "fastify";
import { registerErrorHandler } from "./errors/error-mapper.js";
import { registerAgentTaskRoutes } from "./routes/agent-task/routes.js";
import { registerCategoryRoutes } from "./routes/categories/routes.js";
import { registerDeveloperRoutes } from "./routes/developers/routes.js";
import { createHealthHandlers } from "./routes/health/handler.js";
import { registerHealthRoutes } from "./routes/health/routes.js";
import { registerSkillRoutes } from "./routes/skills/routes.js";
import { registerTaskRoutes } from "./routes/tasks/routes.js";
import type { HealthService } from "./services/health-service.js";

/**
 * Dependencies the composition root injects into route handlers. Production
 * and test bootstraps both go through this same shape; tests substitute
 * fakes without touching Fastify or the route wiring.
 */
export interface AppDependencies {
  healthService: HealthService;
}

export interface AppOptions {
  logger?: boolean;
}

/**
 * Testable Fastify application factory (the composition root). Registers
 * each resource's hand-written, schema-validated routes, binds injected
 * services to their handlers, and installs the single public error mapper.
 */
export function buildApp(
  deps: AppDependencies,
  options: AppOptions = {},
): FastifyInstance {
  const app = Fastify({
    logger: options.logger ?? true,
  });

  registerErrorHandler(app);

  registerHealthRoutes(app, createHealthHandlers(deps.healthService));
  registerTaskRoutes(app);
  registerDeveloperRoutes(app);
  registerSkillRoutes(app);
  registerCategoryRoutes(app);
  registerAgentTaskRoutes(app);

  return app;
}
