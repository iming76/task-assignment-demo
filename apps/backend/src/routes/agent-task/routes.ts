import type { FastifyInstance } from "fastify";
import { errorResponseSchema } from "../schema.js";
import { notImplementedHandler } from "../handler-types.js";
import type { AgentTaskHandlers } from "./handlers.js";
import {
  agentTaskCreatedResponseSchema,
  agentTaskRequestSchema,
} from "./schema.js";

export function registerAgentTaskRoutes(
  app: FastifyInstance,
  handlers: Partial<AgentTaskHandlers> = {},
): void {
  app.post(
    "/agent-task",
    {
      schema: {
        body: agentTaskRequestSchema,
        response: {
          201: agentTaskCreatedResponseSchema,
          400: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    handlers.orchestrateAgentTask ?? notImplementedHandler,
  );
}
