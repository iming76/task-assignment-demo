/**
 * Provider-neutral seam for automatic skill inference. Implementations call
 * an LLM or other provider; callers always validate the returned IDs against
 * real skills before trusting them, and degrade to an empty result rather
 * than blocking task creation. See docs/tasks/05b-add-task-skill-inference.md.
 */
export interface SkillInferenceProvider {
  inferSkillIds(input: {
    title: string;
    description: string;
    availableSkillIds: string[];
  }): Promise<string[]>;
}

/**
 * Temporary fallback seam used until 05b wires a real provider: an omitted
 * requiredSkillIds resolves to [] rather than blocking task creation.
 */
export class NoopSkillInferenceProvider implements SkillInferenceProvider {
  async inferSkillIds(): Promise<string[]> {
    return [];
  }
}
