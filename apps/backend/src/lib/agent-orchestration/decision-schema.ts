import { z } from "zod";
import { MAX_TASK_DEPTH } from "@repo/shared-types";

export const DEFAULT_AGENT_PLAN_LIMITS = {
  maxDepth: MAX_TASK_DEPTH,
  maxNodes: 200,
};

export interface PlannedTaskNode {
  title: string;
  description: string;
  requiredSkillIds: string[];
  requiredRole: string;
  unmatchedSkillRequirements: string[];
  subtasks: PlannedTaskNode[];
}

export type AgentDecision = {
  action: "create_task_tree";
  task: PlannedTaskNode;
};

const plannedTaskSchema: z.ZodType<PlannedTaskNode> = z.lazy(() =>
  z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(5000),
    requiredSkillIds: z.array(z.string()).max(50),
    requiredRole: z.string().trim().min(1).max(100),
    unmatchedSkillRequirements: z
      .array(z.string().trim().min(1).max(100))
      .max(20),
    subtasks: z.array(plannedTaskSchema),
  }),
);

const rootRequiresSubtasks = (node: PlannedTaskNode, ctx: z.RefinementCtx) => {
  if (node.subtasks.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        "The root task represents the whole request and must be broken into at least one subtask.",
      path: ["subtasks"],
    });
  }
};

export const agentDecisionSchema: z.ZodType<AgentDecision> = z.object({
  action: z.literal("create_task_tree"),
  task: plannedTaskSchema.superRefine(rootRequiresSubtasks),
});

export const agentDecisionOutputSchema = agentDecisionSchema;

export function createAgentDecisionOutputSchema(
  allowedSkillIds: readonly string[],
): z.ZodType<AgentDecision> {
  const uniqueSkillIds = [...new Set(allowedSkillIds)];
  const requiredSkillIdSchema =
    uniqueSkillIds.length > 0
      ? z.enum(uniqueSkillIds as [string, ...string[]])
      : z.never();
  const catalogPlannedTaskSchema: z.ZodType<PlannedTaskNode> = z.lazy(() =>
    z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().min(1).max(5000),
      requiredSkillIds: z.array(requiredSkillIdSchema).max(50),
      requiredRole: z.string().trim().min(1).max(100),
      unmatchedSkillRequirements: z
        .array(z.string().trim().min(1).max(100))
        .max(20),
      subtasks: z.array(catalogPlannedTaskSchema),
    }),
  );
  return z.object({
    action: z.literal("create_task_tree"),
    task: catalogPlannedTaskSchema.superRefine(rootRequiresSubtasks),
  });
}

export function normalizeAgentDecisionOutput(value: unknown): AgentDecision {
  const parsed = agentDecisionOutputSchema.parse(value);
  return validateAgentDecision(parsed);
}

export class AgentDecisionValidationError extends Error {}

export function validateAgentDecision(
  value: unknown,
  limits = DEFAULT_AGENT_PLAN_LIMITS,
): AgentDecision {
  const parsed = agentDecisionSchema.safeParse(value);
  if (!parsed.success) {
    throw new AgentDecisionValidationError("Agent decision is malformed.");
  }
  let nodeCount = 0;
  const visit = (nodes: PlannedTaskNode[], depth: number): void => {
    if (depth > limits.maxDepth) {
      throw new AgentDecisionValidationError(
        "Agent plan exceeds maximum depth.",
      );
    }
    for (const node of nodes) {
      nodeCount += 1;
      if (nodeCount > limits.maxNodes) {
        throw new AgentDecisionValidationError(
          "Agent plan has too many tasks.",
        );
      }
      visit(node.subtasks, depth + 1);
    }
  };
  visit([parsed.data.task], 1);
  return parsed.data;
}
