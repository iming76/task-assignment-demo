import { describe, it, expect, vi } from "vitest";
import { OpenAiSkillInferenceProvider } from "../../src/lib/skill-inference/openai-skill-inference-provider.js";
import { SkillInferenceProviderError } from "../../src/lib/skill-inference/skill-inference-provider.js";

const { mockGenerateText } = vi.hoisted(() => ({
  mockGenerateText: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, generateText: mockGenerateText };
});

function buildProvider() {
  return new OpenAiSkillInferenceProvider({
    apiKey: "test-key",
    model: "gpt-4o-mini",
    timeoutMs: 5000,
  });
}

describe("OpenAiSkillInferenceProvider", () => {
  it("returns the generated skill ids", async () => {
    mockGenerateText.mockResolvedValueOnce({
      output: { skillIds: ["skill-1"] },
    });

    const result = await buildProvider().inferSkillIds({
      title: "Build the login form",
      description: "Add a React form with validation.",
      availableSkills: [],
    });

    expect(result).toEqual(["skill-1"]);
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 5000 }),
    );
  });

  it("wraps any generateText failure into SkillInferenceProviderError without leaking the original error", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("boom: leaked detail"));

    await expect(
      buildProvider().inferSkillIds({
        title: "...",
        description: "...",
        availableSkills: [],
      }),
    ).rejects.toThrow(SkillInferenceProviderError);
  });
});
