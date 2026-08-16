import { z } from "zod";

/** Mirrors AgentTaskDraft in @repo/shared-types; kept local since it constrains the provider's structured output, not the HTTP contract. */
export interface AgentTaskDraftShape {
  name: string;
  description: string;
  assigneeId?: string | null;
  requiredSkillIds: string[];
  subtasks: AgentTaskDraftShape[];
}

export const agentTaskDraftSchema: z.ZodType<AgentTaskDraftShape> = z.lazy(() =>
  z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    assigneeId: z.string().nullable().optional(),
    requiredSkillIds: z.array(z.string()),
    subtasks: z.array(agentTaskDraftSchema),
  }),
);

export const agentTaskPlanSchema = z.object({
  tasks: z.array(agentTaskDraftSchema).min(1),
});
