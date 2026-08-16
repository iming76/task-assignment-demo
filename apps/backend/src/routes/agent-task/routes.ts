import type { FastifyInstance } from "fastify";
import { errorResponseSchema } from "../schema.js";
import { notImplementedHandler } from "../handler-types.js";
import type { AgentTaskHandlers } from "./handlers.js";
import {
  agentTaskApplyRequestSchema,
  agentTaskApplyResponseSchema,
  agentTaskDraftSchema,
  agentTaskProposalRequestSchema,
  agentTaskProposalResponseSchema,
} from "./schema.js";

export function registerAgentTaskRoutes(
  app: FastifyInstance,
  handlers: Partial<AgentTaskHandlers> = {},
): void {
  app.addSchema(agentTaskDraftSchema);

  app.post(
    "/agent-task/proposals",
    {
      schema: {
        body: agentTaskProposalRequestSchema,
        response: {
          200: agentTaskProposalResponseSchema,
          400: errorResponseSchema,
          503: errorResponseSchema,
        },
      },
    },
    handlers.createAgentTaskProposal ?? notImplementedHandler,
  );

  app.post(
    "/agent-task/apply",
    {
      schema: {
        body: agentTaskApplyRequestSchema,
        response: {
          201: agentTaskApplyResponseSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    handlers.applyAgentTask ?? notImplementedHandler,
  );
}
