import { generateText, Output, type LanguageModel } from "ai";
import { z } from "zod";
import type { AgentTaskDraft } from "@repo/shared-types";
import { JUDGE_AGENT_PLAN_SYSTEM_PROMPT } from "./prompts/judge-agent-plan-prompt.js";

const judgmentSchema = z.object({
  pass: z.boolean(),
  reasoning: z.string().min(1),
});

export interface JudgeAgentPlanInput {
  model: LanguageModel;
  description: string;
  tasks: AgentTaskDraft[];
}

export interface JudgeAgentPlanResult {
  pass: boolean;
  reasoning: string;
}

/** A second live call that scores a generated draft against the description; see design.md decision 3. */
export async function judgeAgentPlan(
  input: JudgeAgentPlanInput,
): Promise<JudgeAgentPlanResult> {
  const { output } = await generateText({
    model: input.model,
    system: JUDGE_AGENT_PLAN_SYSTEM_PROMPT,
    prompt: JSON.stringify({
      description: input.description,
      tasks: input.tasks,
    }),
    output: Output.object({ schema: judgmentSchema }),
  });
  return output;
}
