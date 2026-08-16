import type { FastifyReply, FastifyRequest } from "fastify";
import type { AgentTaskRequest } from "@repo/shared-types";
import type { AgentTaskService } from "../../services/agent-task-service.js";
import type { RouteHandler } from "../handler-types.js";

export interface AgentTaskHandlers {
  orchestrateAgentTask: RouteHandler;
}

export function createAgentTaskHandlers(
  service: AgentTaskService,
): AgentTaskHandlers {
  return {
    async orchestrateAgentTask(request: FastifyRequest, reply: FastifyReply) {
      const response = await service.orchestrate(
        request.body as AgentTaskRequest,
      );
      if (response.status === "created") reply.status(201);
      return response;
    },
  };
}
