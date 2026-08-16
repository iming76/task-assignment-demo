import { describe, expect, it, vi } from "vitest";
import type { Skill } from "@repo/shared-types";
import { OpenAiAgentOrchestrationProvider } from "../../src/lib/agent-orchestration/openai-agent-orchestration-provider.js";
import { AgentOrchestrationProviderError } from "../../src/lib/agent-orchestration/agent-orchestration-provider.js";

const { mockGenerateText } = vi.hoisted(() => ({ mockGenerateText: vi.fn() }));
vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, generateText: mockGenerateText };
});

const skills: Skill[] = [
  {
    id: "skill-ai",
    name: "Artificial Intelligence",
    description: "Machine learning and AI features.",
    categoryId: "category-backend",
  },
];

function provider() {
  return new OpenAiAgentOrchestrationProvider({
    apiKey: "test-key",
    model: "gpt-4o-mini",
    timeoutMs: 5000,
  });
}

interface MockAgentTools {
  listSkills: {
    execute(input: Record<string, never>): Promise<unknown> | unknown;
  };
  submitDecision: {
    execute(input: {
      action: "ask_clarification" | "create_task_tree";
      question: string | null;
      tasks: unknown[] | null;
    }): Promise<unknown> | unknown;
  };
}

function toolsFrom(rawOptions: unknown): MockAgentTools {
  return (rawOptions as { tools: MockAgentTools }).tools;
}

describe("OpenAiAgentOrchestrationProvider", () => {
  it("allows clarification without searching", async () => {
    mockGenerateText.mockImplementationOnce(async (rawOptions: unknown) => {
      await toolsFrom(rawOptions).submitDecision.execute({
        action: "ask_clarification",
        question: "Which platform?",
        tasks: null,
      });
      return {};
    });
    const result = await provider().decide({
      messages: [{ role: "user", content: "Build it." }],
      skills,
    });
    expect(result.decision.action).toBe("ask_clarification");
    expect(result.skillCatalogListed).toBe(false);
  });

  it("lists the complete canonical skill catalog before creation", async () => {
    mockGenerateText.mockImplementationOnce(async (rawOptions: unknown) => {
      const tools = toolsFrom(rawOptions);
      const listedSkills = await tools.listSkills.execute({});
      expect(listedSkills).toEqual([
        {
          id: "skill-ai",
          name: "Artificial Intelligence",
          description: "Machine learning and AI features.",
        },
      ]);
      await tools.submitDecision.execute({
        action: "create_task_tree",
        question: null,
        tasks: [
          {
            title: "Build AI moderation",
            description: "Detect unsafe images.",
            requiredSkillIds: ["skill-ai"],
            requiredRole: "AI Engineer",
            unmatchedSkillRequirements: [],
            subtasks: [],
          },
        ],
      });
      return {};
    });
    const result = await provider().decide({
      messages: [{ role: "user", content: "Build AI moderation." }],
      skills,
    });
    expect(result.skillCatalogListed).toBe(true);
  });

  it("allows unmatched work after listing an empty catalog", async () => {
    mockGenerateText.mockImplementationOnce(async (rawOptions: unknown) => {
      const tools = toolsFrom(rawOptions);
      expect(await tools.listSkills.execute({})).toEqual([]);
      await tools.submitDecision.execute({
        action: "create_task_tree",
        question: null,
        tasks: [
          {
            title: "Build quantum integration",
            description: "Integrate unsupported quantum hardware.",
            requiredSkillIds: [],
            requiredRole: "Quantum Engineer",
            unmatchedSkillRequirements: ["quantum hardware"],
            subtasks: [],
          },
        ],
      });
      return {};
    });
    const result = await provider().decide({
      messages: [{ role: "user", content: "Build quantum integration." }],
      skills: [],
    });
    expect(result.skillCatalogListed).toBe(true);
    expect(result.decision.action).toBe("create_task_tree");
  });

  it("rejects creation without listing the skill catalog", async () => {
    mockGenerateText.mockImplementationOnce(async (rawOptions: unknown) => {
      await toolsFrom(rawOptions).submitDecision.execute({
        action: "create_task_tree",
        question: null,
        tasks: [
          {
            title: "Task",
            description: "Description",
            requiredSkillIds: [],
            requiredRole: "Engineer",
            unmatchedSkillRequirements: ["unknown technology"],
            subtasks: [],
          },
        ],
      });
      return {};
    });
    await expect(
      provider().decide({
        messages: [{ role: "user", content: "Build it." }],
        skills,
      }),
    ).rejects.toThrow(AgentOrchestrationProviderError);
  });

  it("rejects an exhausted tool loop without a submitted decision", async () => {
    mockGenerateText.mockResolvedValueOnce({});
    await expect(
      provider().decide({
        messages: [{ role: "user", content: "Build it." }],
        skills,
      }),
    ).rejects.toThrow("exhausted its tool steps");
  });

  it("wraps provider and malformed-output failures", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("boom"));
    await expect(
      provider().decide({
        messages: [{ role: "user", content: "Build it." }],
        skills,
      }),
    ).rejects.toThrow(AgentOrchestrationProviderError);
  });
});
