import { createOpenAI } from "@ai-sdk/openai";
import {
  generateText,
  hasToolCall,
  stepCountIs,
  tool,
  type LanguageModel,
} from "ai";
import { z } from "zod";
import {
  AgentOrchestrationProviderError,
  type AgentOrchestrationContext,
  type AgentOrchestrationProvider,
  type AgentOrchestrationResult,
} from "./agent-orchestration-provider.js";
import {
  agentDecisionOutputSchema,
  normalizeAgentDecisionOutput,
  type AgentDecision,
} from "./decision-schema.js";
import { AGENT_ORCHESTRATION_SYSTEM_PROMPT } from "./prompts/agent-orchestration-system-prompt.js";

export interface OpenAiAgentOrchestrationProviderConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
  maxSteps?: number;
}

export function isSupportedAgentOrchestrationProvider(
  provider: string,
): provider is "openai" {
  return provider === "openai";
}

export class OpenAiAgentOrchestrationProvider implements AgentOrchestrationProvider {
  private readonly model: LanguageModel;
  private readonly timeoutMs: number;
  private readonly maxSteps: number;

  constructor(config: OpenAiAgentOrchestrationProviderConfig) {
    this.model = createOpenAI({ apiKey: config.apiKey })(config.model);
    this.timeoutMs = config.timeoutMs;
    this.maxSteps = config.maxSteps ?? 8;
  }

  async decide(
    context: AgentOrchestrationContext,
  ): Promise<AgentOrchestrationResult> {
    let skillCatalogListed = false;
    let decision: AgentDecision | undefined;
    try {
      await generateText({
        model: this.model,
        system: AGENT_ORCHESTRATION_SYSTEM_PROMPT,
        prompt: JSON.stringify({ messages: context.messages }),
        tools: {
          listSkills: tool({
            description:
              "List all current canonical skills with their names, descriptions, and category.",
            inputSchema: z.object({}),
            execute: () => {
              skillCatalogListed = true;
              return context.skills.map(
                ({ id, name, description, categoryId }) => ({
                  id,
                  name,
                  description,
                  categoryId,
                }),
              );
            },
          }),
          submitDecision: tool({
            description:
              "Submit the final task-tree decision after skill discovery.",
            inputSchema: agentDecisionOutputSchema,
            execute: (input) => {
              const submittedDecision = normalizeAgentDecisionOutput(input);
              if (!skillCatalogListed) {
                throw new AgentOrchestrationProviderError(
                  "Agent attempted creation without listing the skill catalog.",
                );
              }
              decision = submittedDecision;
              return { accepted: true };
            },
          }),
        },
        stopWhen: [hasToolCall("submitDecision"), stepCountIs(this.maxSteps)],
        timeout: this.timeoutMs,
      });
      if (!decision) {
        throw new AgentOrchestrationProviderError(
          "Agent orchestration exhausted its tool steps without a decision.",
        );
      }
      return { decision, skillCatalogListed };
    } catch (error) {
      if (error instanceof AgentOrchestrationProviderError) throw error;
      throw new AgentOrchestrationProviderError(
        "Agent orchestration provider request failed.",
        { cause: error },
      );
    }
  }
}
