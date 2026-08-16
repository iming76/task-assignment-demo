import { createOpenAI } from "@ai-sdk/openai";
import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import { SKILL_INFERENCE_SYSTEM_PROMPT } from "./prompts/skill-inference-system-prompt.js";
import {
  SkillInferenceProviderError,
  type SkillInferenceProvider,
  type SkillInferenceRequest,
} from "./skill-inference-provider.js";

const skillInferenceOutputSchema = z.object({
  skillIds: z.array(z.string()),
});

export interface OpenAiSkillInferenceProviderConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

/** Only "openai" resolves to a real adapter today; extend this alongside a new provider class for another vendor. */
export function isSupportedSkillInferenceProvider(
  provider: string,
): provider is "openai" {
  return provider === "openai";
}

/**
 * Structured-output generation via the AI SDK's Output.object, mirroring
 * ../task-planning/openai-task-planning-provider.ts. The catalog constrains
 * the prompt, not the schema -- SkillInferenceService still re-validates
 * every id against the current catalog before trusting it.
 */
export class OpenAiSkillInferenceProvider implements SkillInferenceProvider {
  private readonly model: LanguageModel;
  private readonly timeoutMs: number;

  constructor(config: OpenAiSkillInferenceProviderConfig) {
    const provider = createOpenAI({ apiKey: config.apiKey });
    this.model = provider(config.model);
    this.timeoutMs = config.timeoutMs;
  }

  async inferSkillIds(input: SkillInferenceRequest): Promise<string[]> {
    try {
      const { output } = await generateText({
        model: this.model,
        system: SKILL_INFERENCE_SYSTEM_PROMPT,
        prompt: buildPrompt(input),
        output: Output.object({ schema: skillInferenceOutputSchema }),
        timeout: this.timeoutMs,
      });
      return output.skillIds;
    } catch {
      throw new SkillInferenceProviderError(
        "Skill inference provider request failed.",
      );
    }
  }
}

function buildPrompt(input: SkillInferenceRequest): string {
  return JSON.stringify({
    title: input.title,
    description: input.description,
    availableSkills: input.availableSkills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      categoryId: skill.categoryId,
    })),
  });
}
