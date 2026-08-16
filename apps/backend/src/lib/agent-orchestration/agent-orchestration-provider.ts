import type { AgentTaskMessage, Category, Skill } from "@repo/shared-types";
import type { AgentDecision } from "./decision-schema.js";

export interface AgentOrchestrationContext {
  messages: AgentTaskMessage[];
  skills: Skill[];
  categories: Category[];
}

export interface AgentOrchestrationResult {
  decision: AgentDecision;
  skillCatalogListed: boolean;
}

export interface AgentOrchestrationProvider {
  decide(context: AgentOrchestrationContext): Promise<AgentOrchestrationResult>;
}

export class AgentOrchestrationProviderError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class NotConfiguredAgentOrchestrationProvider implements AgentOrchestrationProvider {
  async decide(): Promise<AgentOrchestrationResult> {
    throw new AgentOrchestrationProviderError(
      "Agent orchestration provider is not configured.",
    );
  }
}
