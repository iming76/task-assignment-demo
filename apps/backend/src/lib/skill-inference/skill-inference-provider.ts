import type { Skill } from "@repo/shared-types";

export interface SkillInferenceRequest {
  title: string;
  description: string;
  availableSkills: Skill[];
}

/**
 * Provider-neutral seam for automatic skill inference, mirroring
 * ../task-planning/task-planning-provider.ts. The raw AI SDK adapter lives
 * in openai-skill-inference-provider.ts. Implementations return untrusted
 * candidate skill ids; SkillInferenceService (skill-inference-service.ts)
 * is the only caller and rejects any output that is not entirely canonical
 * rather than trusting it partially. See
 * docs/tasks/05b-add-task-skill-inference.md.
 */
export interface SkillInferenceProvider {
  inferSkillIds(input: SkillInferenceRequest): Promise<string[]>;
}

export class SkillInferenceProviderError extends Error {}

/** Used whenever no provider credentials are configured; task creation stays available without it. */
export class NotConfiguredSkillInferenceProvider implements SkillInferenceProvider {
  async inferSkillIds(): Promise<string[]> {
    throw new SkillInferenceProviderError(
      "Skill inference provider is not configured.",
    );
  }
}
