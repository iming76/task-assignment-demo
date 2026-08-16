import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output, type LanguageModel } from "ai";
import { agentTaskPlanSchema } from "./agent-task-draft-schema.js";
import { TASK_PLANNING_SYSTEM_PROMPT } from "./prompts/task-planning-system-prompt.js";
import {
  TaskPlanningProviderError,
  type TaskPlanningContext,
  type TaskPlanningProvider,
} from "./task-planning-provider.js";

export interface OpenAiTaskPlanningProviderConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

/** Only "openai" resolves to a real adapter today; extend this alongside a new provider class for another vendor. */
export function isSupportedTaskPlanningProvider(
  provider: string,
): provider is "openai" {
  return provider === "openai";
}

/**
 * Structured-output generation via the AI SDK's Output.object, replacing the
 * deprecated generateObject/streamObject
 * (https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0#generateobject-and-streamobject-deprecation).
 * The schema enforces shape; callers still re-resolve every ID against
 * current data before trusting it (see draft-resolution.ts).
 */
export class OpenAiTaskPlanningProvider implements TaskPlanningProvider {
  private readonly model: LanguageModel;
  private readonly timeoutMs: number;

  constructor(config: OpenAiTaskPlanningProviderConfig) {
    const provider = createOpenAI({ apiKey: config.apiKey });
    this.model = provider(config.model);
    this.timeoutMs = config.timeoutMs;
  }

  async generate(context: TaskPlanningContext): Promise<unknown> {
    try {
      const { output } = await generateText({
        model: this.model,
        system: TASK_PLANNING_SYSTEM_PROMPT,
        prompt: buildPrompt(context),
        output: Output.object({ schema: agentTaskPlanSchema }),
        timeout: this.timeoutMs,
      });
      return output.tasks;
    } catch {
      throw new TaskPlanningProviderError(
        "Agent planning provider request failed.",
      );
    }
  }
}

function buildPrompt(context: TaskPlanningContext): string {
  return JSON.stringify({
    description: context.description,
    skills: context.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      categoryId: skill.categoryId,
    })),
    developers: context.developers.map((developer) => ({
      id: developer.id,
      name: developer.name,
      skillIds: developer.skillIds,
    })),
  });
}
