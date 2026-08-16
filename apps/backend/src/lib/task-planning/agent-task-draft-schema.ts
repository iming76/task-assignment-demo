import { z } from "zod";

/**
 * Mirrors AgentTaskDraft in @repo/shared-types; kept local since it
 * constrains the provider's structured output, not the HTTP contract.
 * assigneeId is required-but-nullable rather than optional: OpenAI's
 * strict structured-output mode rejects a JSON schema where a property is
 * absent from `required` (400 invalid_json_schema), so every key here must
 * be required even when its value can be null.
 */
export interface AgentTaskDraftShape {
  name: string;
  description: string;
  assigneeId: string | null;
  requiredSkillIds: string[];
  subtasks: AgentTaskDraftShape[];
}

export const agentTaskDraftSchema: z.ZodType<AgentTaskDraftShape> = z.lazy(() =>
  z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    assigneeId: z.string().nullable(),
    requiredSkillIds: z.array(z.string()),
    subtasks: z.array(agentTaskDraftSchema),
  }),
);

export const agentTaskPlanSchema = z.object({
  tasks: z.array(agentTaskDraftSchema).min(1),
});
