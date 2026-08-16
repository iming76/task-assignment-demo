import type { SkillRepository } from "../repositories/skill-repository.js";
import {
  SkillInferenceProviderError,
  type SkillInferenceProvider,
} from "./skill-inference-provider.js";

export interface SkillInferenceInput {
  title: string;
  description: string;
}

/**
 * Business-logic seam between task creation and the raw provider adapter:
 * supplies the current categorized skill catalog as context, then rejects
 * any output that is not entirely canonical rather than trusting it
 * partially. Never throws -- every failure degrades to [] so a provider
 * outage or bad output can never block task creation.
 */
export interface SkillInferenceService {
  inferSkillIds(input: SkillInferenceInput): Promise<string[]>;
}

export class DefaultSkillInferenceService implements SkillInferenceService {
  constructor(
    private readonly provider: SkillInferenceProvider,
    private readonly skillRepository: SkillRepository,
  ) {}

  async inferSkillIds(input: SkillInferenceInput): Promise<string[]> {
    const availableSkills = await this.skillRepository.list();
    if (availableSkills.length === 0) return [];

    let candidateIds: string[];
    try {
      candidateIds = await this.provider.inferSkillIds({
        title: input.title,
        description: input.description,
        availableSkills,
      });
    } catch (error) {
      logInferenceFallback(error);
      return [];
    }

    const canonicalIds = new Set(availableSkills.map((skill) => skill.id));
    const isEntirelyCanonical = candidateIds.every((id) =>
      canonicalIds.has(id),
    );
    if (!isEntirelyCanonical) {
      logInferenceFallback(
        new SkillInferenceProviderError(
          "Inferred skill ids include a value outside the current catalog.",
        ),
      );
      return [];
    }

    return Array.from(new Set(candidateIds));
  }
}

/** Logs only a static reason, never the title/description/provider payload, so diagnostics can't leak task content. */
function logInferenceFallback(error: unknown): void {
  const reason =
    error instanceof SkillInferenceProviderError
      ? error.message
      : "unexpected inference error";
  console.warn(`[skill-inference] falling back to no skills: ${reason}`);
}
