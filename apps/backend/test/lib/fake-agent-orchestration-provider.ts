import type {
  AgentOrchestrationContext,
  AgentOrchestrationProvider,
  AgentOrchestrationResult,
} from "../../src/lib/agent-orchestration/agent-orchestration-provider.js";

export class FakeAgentOrchestrationProvider implements AgentOrchestrationProvider {
  constructor(
    private readonly onDecide: (
      context: AgentOrchestrationContext,
    ) => Promise<AgentOrchestrationResult>,
  ) {}

  decide(
    context: AgentOrchestrationContext,
  ): Promise<AgentOrchestrationResult> {
    return this.onDecide(context);
  }
}
