import type {
  SkillInferenceProvider,
  SkillInferenceRequest,
} from "../../src/lib/skill-inference/skill-inference-provider.js";

export class FakeSkillInferenceProvider implements SkillInferenceProvider {
  callCount = 0;

  constructor(
    private readonly onInfer: (
      request: SkillInferenceRequest,
    ) => Promise<string[]>,
  ) {}

  inferSkillIds(request: SkillInferenceRequest): Promise<string[]> {
    this.callCount += 1;
    return this.onInfer(request);
  }
}
