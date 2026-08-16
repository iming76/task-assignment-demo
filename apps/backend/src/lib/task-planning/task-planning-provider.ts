import type { Developer, Skill } from "@repo/shared-types";

export interface TaskPlanningContext {
  description: string;
  skills: Skill[];
  developers: Developer[];
}

/**
 * Provider-neutral seam for agent-driven plan generation, mirroring
 * ../skill-inference/skill-inference-provider.ts. Callers always treat the
 * returned value as untrusted and validate it before use; a thrown
 * TaskPlanningProviderError maps to AGENT_UNAVAILABLE, never a 500.
 */
export interface TaskPlanningProvider {
  generate(context: TaskPlanningContext): Promise<unknown>;
}

export class TaskPlanningProviderError extends Error {}

/** Used whenever no provider credentials are configured; apply stays available without it. */
export class NotConfiguredTaskPlanningProvider implements TaskPlanningProvider {
  async generate(): Promise<unknown> {
    throw new TaskPlanningProviderError(
      "Agent planning provider is not configured.",
    );
  }
}
