import type { RouteHandler } from "../handler-types.js";

/** Implemented by add-agent-planning-api. */
export interface AgentTaskHandlers {
  createAgentTaskProposal: RouteHandler;
  applyAgentTask: RouteHandler;
}
