import { describe, it, expect, vi } from "vitest";
import { OpenAiTaskPlanningProvider } from "../../src/lib/task-planning/openai-task-planning-provider.js";
import { TaskPlanningProviderError } from "../../src/lib/task-planning/task-planning-provider.js";

const { mockGenerateText } = vi.hoisted(() => ({
  mockGenerateText: vi.fn(),
}));

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, generateText: mockGenerateText };
});

function buildProvider() {
  return new OpenAiTaskPlanningProvider({
    apiKey: "test-key",
    model: "gpt-4o-mini",
    timeoutMs: 5000,
  });
}

describe("OpenAiTaskPlanningProvider", () => {
  it("returns the generated tasks array", async () => {
    mockGenerateText.mockResolvedValueOnce({
      output: { tasks: [{ name: "A" }] },
    });

    const result = await buildProvider().generate({
      description: "Build a task assignment system.",
      skills: [],
      developers: [],
    });

    expect(result).toEqual([{ name: "A" }]);
    expect(mockGenerateText).toHaveBeenCalledWith(
      expect.objectContaining({ timeout: 5000 }),
    );
  });

  it("wraps any generateText failure into TaskPlanningProviderError", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("boom"));

    await expect(
      buildProvider().generate({
        description: "...",
        skills: [],
        developers: [],
      }),
    ).rejects.toThrow(TaskPlanningProviderError);
  });
});
