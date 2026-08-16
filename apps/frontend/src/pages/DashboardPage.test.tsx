import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithQueryClient } from "../test/render";
import { DEFAULT_API_BASE_URL } from "../api/http";
import { DashboardPage } from "./DashboardPage";

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

function renderDashboard() {
  return renderWithQueryClient(<DashboardPage />);
}

describe("DashboardPage", () => {
  it("shows a loading state before data arrives", () => {
    mockApi({
      "GET /tasks": () => new Promise(() => {}),
      "GET /developers": () => new Promise(() => {}),
    });

    renderDashboard();

    expect(screen.getByText("Loading dashboard…")).toBeInTheDocument();
  });

  it("shows both setup actions when tasks and developers are empty", async () => {
    mockApi({
      "GET /tasks": { status: 200, body: [] },
      "GET /developers": { status: 200, body: [] },
    });

    renderDashboard();

    expect(
      await screen.findByRole("link", { name: "Create your first task" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Create your first developer" }),
    ).toBeInTheDocument();
  });

  it("shows an overview without setup actions once data exists", async () => {
    mockApi({
      "GET /tasks": {
        status: 200,
        body: [
          {
            id: "t1",
            title: "Ship it",
            description: "...",
            status: "TODO",
            depth: 1,
            assigneeId: null,
            parentTaskId: null,
            requiredSkillIds: [],
          },
        ],
      },
      "GET /developers": {
        status: 200,
        body: [{ id: "d1", name: "Ada", skillIds: [] }],
      },
    });

    renderDashboard();

    expect(
      await screen.findByText("1 task and 1 developer on record."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Create your first task" }),
    ).not.toBeInTheDocument();
  });

  it("shows an error state when the task list fails to load", async () => {
    mockApi({
      "GET /tasks": {
        status: 500,
        body: {
          error: { code: "INTERNAL_ERROR", message: "Server exploded." },
        },
      },
      "GET /developers": { status: 200, body: [] },
    });

    renderDashboard();

    expect(await screen.findByText("Server exploded.")).toBeInTheDocument();
  });
});
