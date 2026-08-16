import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithQueryClient } from "../test/render";
import { DEFAULT_API_BASE_URL } from "../api/http";
import { AgentTaskPage } from "./AgentTaskPage";

interface MockResponse {
  status: number;
  body: unknown;
}

function mockApi(
  responses: Record<string, MockResponse | (() => Promise<MockResponse>)>,
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      const path = url.replace(DEFAULT_API_BASE_URL, "");
      const key = `${init?.method ?? "GET"} ${path}`;
      const entry = responses[key];
      if (!entry) {
        throw new Error(`Unhandled request: ${key}`);
      }
      const resolved = typeof entry === "function" ? await entry() : entry;
      return {
        ok: resolved.status < 400,
        status: resolved.status,
        json: async () => resolved.body,
      } as Response;
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

const noDevelopers = { "GET /developers": { status: 200, body: [] } };
const noSkills = { "GET /skills": { status: 200, body: [] } };

const threeLevelDraft = [
  {
    name: "Root",
    description: "Root work.",
    assigneeId: null,
    requiredSkillIds: [],
    subtasks: [
      {
        name: "Child",
        description: "Child work.",
        assigneeId: null,
        requiredSkillIds: [],
        subtasks: [
          {
            name: "Grandchild",
            description: "Grandchild work.",
            assigneeId: null,
            requiredSkillIds: [],
            subtasks: [],
          },
        ],
      },
    ],
  },
];

async function generate(
  user: ReturnType<typeof userEvent.setup>,
  description = "Build the feature.",
) {
  await user.type(
    screen.getByLabelText("Describe the work you need done"),
    description,
  );
  await user.click(screen.getByRole("button", { name: "Generate plan" }));
}

describe("AgentTaskPage", () => {
  it("starts on the generate form with no draft yet", () => {
    renderWithQueryClient(<AgentTaskPage />);

    expect(
      screen.getByRole("button", { name: "Generate plan" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Review the generated plan"),
    ).not.toBeInTheDocument();
  });

  it("generates a plan and renders a three-level draft for review", async () => {
    const user = userEvent.setup();
    mockApi({
      ...noDevelopers,
      ...noSkills,
      "POST /agent-task/proposals": {
        status: 200,
        body: { tasks: threeLevelDraft },
      },
    });

    renderWithQueryClient(<AgentTaskPage />);
    await generate(user);

    expect(
      await screen.findByText("Review the generated plan"),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("Root")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Child")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Grandchild")).toBeInTheDocument();
  });

  it("edits a nested draft node without affecting its siblings", async () => {
    const user = userEvent.setup();
    mockApi({
      ...noDevelopers,
      ...noSkills,
      "POST /agent-task/proposals": {
        status: 200,
        body: { tasks: threeLevelDraft },
      },
      "POST /agent-task/apply": {
        status: 201,
        body: [],
      },
    });

    renderWithQueryClient(<AgentTaskPage />);
    await generate(user);
    await screen.findByDisplayValue("Grandchild");

    const grandchildNameInput = screen.getByDisplayValue("Grandchild");
    await user.clear(grandchildNameInput);
    await user.type(grandchildNameInput, "Renamed grandchild");
    await user.click(screen.getByRole("button", { name: "Apply plan" }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        `${DEFAULT_API_BASE_URL}/agent-task/apply`,
        expect.objectContaining({ method: "POST" }),
      ),
    );
    const applyCall = vi
      .mocked(fetch)
      .mock.calls.find(
        ([url]) => typeof url === "string" && url.endsWith("/agent-task/apply"),
      );
    const sentBody = JSON.parse(applyCall![1]!.body as string);
    expect(sentBody.tasks[0].name).toBe("Root");
    expect(sentBody.tasks[0].subtasks[0].name).toBe("Child");
    expect(sentBody.tasks[0].subtasks[0].subtasks[0].name).toBe(
      "Renamed grandchild",
    );
  });

  it("discards the draft without sending an apply request", async () => {
    const user = userEvent.setup();
    mockApi({
      ...noDevelopers,
      ...noSkills,
      "POST /agent-task/proposals": {
        status: 200,
        body: { tasks: threeLevelDraft },
      },
    });

    renderWithQueryClient(<AgentTaskPage />);
    await generate(user);
    await screen.findByText("Review the generated plan");

    await user.click(screen.getByRole("button", { name: "Discard" }));

    expect(
      screen.getByRole("button", { name: "Generate plan" }),
    ).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalledWith(
      `${DEFAULT_API_BASE_URL}/agent-task/apply`,
      expect.anything(),
    );
  });

  it("applies the plan and returns to the generate form on success", async () => {
    const user = userEvent.setup();
    mockApi({
      ...noDevelopers,
      ...noSkills,
      "POST /agent-task/proposals": {
        status: 200,
        body: { tasks: [threeLevelDraft[0]] },
      },
      "POST /agent-task/apply": {
        status: 201,
        body: [
          {
            id: "t1",
            title: "Root",
            description: "Root work.",
            status: "TODO",
            depth: 1,
            assigneeId: null,
            parentTaskId: null,
            requiredSkillIds: [],
          },
        ],
      },
    });

    renderWithQueryClient(<AgentTaskPage />);
    await generate(user);
    await screen.findByText("Review the generated plan");

    await user.click(screen.getByRole("button", { name: "Apply plan" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Generate plan" }),
      ).toBeInTheDocument(),
    );
  });

  it("shows a planning-unavailable message without breaking the page", async () => {
    const user = userEvent.setup();
    mockApi({
      ...noDevelopers,
      ...noSkills,
      "POST /agent-task/proposals": {
        status: 503,
        body: {
          error: {
            code: "AGENT_UNAVAILABLE",
            message: "Agent planning is not available right now.",
          },
        },
      },
    });

    renderWithQueryClient(<AgentTaskPage />);
    await generate(user);

    expect(
      await screen.findByText(
        "Agent-assisted planning isn't available right now. You can still create tasks manually from the Tasks page.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Generate plan" }),
    ).toBeInTheDocument();
  });

  it("shows apply-time validation feedback and keeps the reviewed draft for correction on a stale reference", async () => {
    const user = userEvent.setup();
    mockApi({
      ...noDevelopers,
      ...noSkills,
      "POST /agent-task/proposals": {
        status: 200,
        body: { tasks: [threeLevelDraft[0]] },
      },
      "POST /agent-task/apply": {
        status: 404,
        body: {
          error: { code: "NOT_FOUND", message: "Skill with id s1 not found" },
        },
      },
    });

    renderWithQueryClient(<AgentTaskPage />);
    await generate(user);
    await screen.findByText("Review the generated plan");

    await user.click(screen.getByRole("button", { name: "Apply plan" }));

    expect(
      await screen.findByText("Skill with id s1 not found"),
    ).toBeInTheDocument();
    expect(screen.getByText("Review the generated plan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Root")).toBeInTheDocument();
  });

  it("shows a skill-mismatch message when an edited assignee no longer qualifies", async () => {
    const user = userEvent.setup();
    mockApi({
      ...noDevelopers,
      ...noSkills,
      "POST /agent-task/proposals": {
        status: 200,
        body: { tasks: [threeLevelDraft[0]] },
      },
      "POST /agent-task/apply": {
        status: 409,
        body: {
          error: {
            code: "SKILL_MISMATCH",
            message: "Developer d1 does not cover every required skill",
          },
        },
      },
    });

    renderWithQueryClient(<AgentTaskPage />);
    await generate(user);
    await screen.findByText("Review the generated plan");

    await user.click(screen.getByRole("button", { name: "Apply plan" }));

    expect(
      await screen.findByText(
        "Developer d1 does not cover every required skill",
      ),
    ).toBeInTheDocument();
  });

  it("flags a required-skill combination with no eligible developer", async () => {
    const user = userEvent.setup();
    mockApi({
      "GET /developers": {
        status: 200,
        body: [{ id: "d1", name: "Ada", skillIds: [] }],
      },
      "GET /skills": {
        status: 200,
        body: [
          { id: "s1", name: "React", description: "UI", categoryId: "c1" },
        ],
      },
      "POST /agent-task/proposals": {
        status: 200,
        body: {
          tasks: [
            {
              name: "Root",
              description: "Root work.",
              assigneeId: null,
              requiredSkillIds: ["s1"],
              subtasks: [],
            },
          ],
        },
      },
    });

    renderWithQueryClient(<AgentTaskPage />);
    await generate(user);

    expect(
      await screen.findByText(
        "No developer currently covers every required skill.",
      ),
    ).toBeInTheDocument();
  });

  it("does not reference any AI provider dependency from the frontend package", async () => {
    const packageJson = await import("../../package.json");
    const deps = {
      ...(packageJson.dependencies ?? {}),
      ...(packageJson.devDependencies ?? {}),
    };
    expect(Object.keys(deps)).not.toContain("openai");
    expect(Object.keys(deps)).not.toContain("@ai-sdk/openai");
    expect(Object.keys(deps)).not.toContain("ai");
  });
});
