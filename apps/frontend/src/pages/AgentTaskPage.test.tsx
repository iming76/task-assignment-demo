import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "../test/render";
import { DEFAULT_API_BASE_URL } from "../api/http";
import { AgentTaskPage } from "./AgentTaskPage";

interface MockResponse {
  status: number;
  body: unknown;
}

function mockOrchestration(responder: () => MockResponse) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      const response = responder();
      return {
        ok: response.status < 400,
        status: response.status,
        json: async () => response.body,
      } as Response;
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

async function submit(user: ReturnType<typeof userEvent.setup>, text: string) {
  const input = screen.getByRole("textbox");
  await user.clear(input);
  await user.type(input, text);
  await user.click(
    screen.getByRole("button", { name: /Create tasks|Send answer/ }),
  );
}

describe("AgentTaskPage", () => {
  it("starts with the autonomous task creation form", () => {
    renderWithQueryClient(<AgentTaskPage />);
    expect(
      screen.getByRole("button", { name: "Create tasks" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Review the generated plan"),
    ).not.toBeInTheDocument();
  });

  it("preserves repeated clarification turns and sends the full conversation", async () => {
    const responses: MockResponse[] = [
      {
        status: 200,
        body: { status: "needs_clarification", question: "Which fields?" },
      },
      {
        status: 200,
        body: {
          status: "needs_clarification",
          question: "Which image formats?",
        },
      },
    ];
    mockOrchestration(() => responses.shift()!);
    const user = userEvent.setup();
    renderWithQueryClient(<AgentTaskPage />);

    await submit(user, "Update user profiles.");
    expect(await screen.findByText("Which fields?")).toBeInTheDocument();
    await submit(user, "Name and biography.");
    expect(await screen.findByText("Which image formats?")).toBeInTheDocument();

    const secondCall = vi.mocked(fetch).mock.calls[1];
    expect(secondCall?.[0]).toBe(`${DEFAULT_API_BASE_URL}/agent-task`);
    expect(JSON.parse(secondCall?.[1]?.body as string).messages).toEqual([
      { role: "user", content: "Update user profiles." },
      { role: "assistant", content: "Which fields?" },
      { role: "user", content: "Name and biography." },
    ]);
  });

  it("renders persisted tasks and staffing gaps as a successful outcome", async () => {
    mockOrchestration(() => ({
      status: 201,
      body: {
        status: "created",
        message:
          "Created 1 task. One task remains unassigned and requires AI Engineer.",
        tasks: [
          {
            id: "task-1",
            title: "AI image moderation",
            description: "Detect unsafe profile images.",
            status: "TODO",
            depth: 1,
            assigneeId: null,
            parentTaskId: null,
            requiredSkillIds: ["skill-ai"],
          },
        ],
        staffingGaps: [
          {
            taskId: "task-1",
            taskTitle: "AI image moderation",
            requiredRole: "AI Engineer",
            requiredSkillIds: ["skill-ai"],
          },
        ],
      },
    }));
    const user = userEvent.setup();
    renderWithQueryClient(<AgentTaskPage />);
    await submit(user, "Moderate profile images with AI.");

    expect(await screen.findByText("Tasks created")).toBeInTheDocument();
    expect(
      screen.getByText("AI image moderation requires AI Engineer (skill-ai)"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Apply plan" }),
    ).not.toBeInTheDocument();
  });

  it("shows planning-unavailable feedback without breaking manual workflows", async () => {
    mockOrchestration(() => ({
      status: 503,
      body: { error: { code: "AGENT_UNAVAILABLE", message: "Unavailable" } },
    }));
    const user = userEvent.setup();
    renderWithQueryClient(<AgentTaskPage />);
    await submit(user, "Build it.");
    expect(
      await screen.findByText(/isn't available right now/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create tasks" }),
    ).toBeInTheDocument();
  });

  it("does not include an AI provider in the frontend package", async () => {
    const packageJson = await import("../../package.json");
    const dependencies = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };
    expect(Object.keys(dependencies)).not.toContain("@ai-sdk/openai");
    expect(Object.keys(dependencies)).not.toContain("ai");
  });
});
