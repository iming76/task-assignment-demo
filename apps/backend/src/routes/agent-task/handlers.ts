import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  AgentTaskApplyRequest,
  AgentTaskProposalRequest,
} from "@repo/shared-types";
import type { RouteHandler } from "../handler-types.js";
import type { AgentTaskService } from "../../services/agent-task-service.js";

export interface AgentTaskHandlers {
  createAgentTaskProposal: RouteHandler;
  applyAgentTask: RouteHandler;
}

export function createAgentTaskHandlers(
  service: AgentTaskService,
): AgentTaskHandlers {
  return {
    async createAgentTaskProposal(request: FastifyRequest) {
      const input = request.body as AgentTaskProposalRequest;
      return service.propose(input);
    },

    async applyAgentTask(request: FastifyRequest, reply: FastifyReply) {
      const input = request.body as AgentTaskApplyRequest;
      const tasks = await service.apply(input);
      reply.status(201);
      return tasks;
    },
  };
}
