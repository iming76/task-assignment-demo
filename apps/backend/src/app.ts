import Fastify, { type FastifyInstance } from "fastify";
import { registerErrorHandler } from "./errors/error-mapper.js";
import { registerAgentTaskRoutes } from "./routes/agent-task/routes.js";
import { registerCategoryRoutes } from "./routes/categories/routes.js";
import { createCategoryHandlers } from "./routes/categories/handlers.js";
import { registerDeveloperRoutes } from "./routes/developers/routes.js";
import { createDeveloperHandlers } from "./routes/developers/handlers.js";
import { createHealthHandlers } from "./routes/health/handler.js";
import { registerHealthRoutes } from "./routes/health/routes.js";
import { registerSkillRoutes } from "./routes/skills/routes.js";
import { createSkillHandlers } from "./routes/skills/handlers.js";
import { registerTaskRoutes } from "./routes/tasks/routes.js";
import { createTaskHandlers } from "./routes/tasks/handlers.js";
import type { HealthService } from "./services/health-service.js";
import type { TaskService } from "./services/task-service.js";
import type { DeveloperService } from "./services/developer-service.js";
import type { SkillService } from "./services/skill-service.js";
import type { CategoryService } from "./services/category-service.js";

/**
 * Dependencies the composition root injects into route handlers. Production
 * and test bootstraps both go through this same shape; tests substitute
 * fakes without touching Fastify or the route wiring.
 */
export interface AppDependencies {
  healthService: HealthService;
  taskService: TaskService;
  developerService: DeveloperService;
  skillService: SkillService;
  categoryService: CategoryService;
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
  registerTaskRoutes(app, createTaskHandlers(deps.taskService));
  registerDeveloperRoutes(app, createDeveloperHandlers(deps.developerService));
  registerSkillRoutes(app, createSkillHandlers(deps.skillService));
  registerCategoryRoutes(app, createCategoryHandlers(deps.categoryService));
  registerAgentTaskRoutes(app);

  return app;
}
