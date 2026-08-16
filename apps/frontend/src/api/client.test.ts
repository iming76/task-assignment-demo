import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "./client";
import { DEFAULT_API_BASE_URL } from "./http";

function mockFetchOnce(body: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status < 400,
      status,
      json: async () => body,
    } as Response),
  );
}

function lastCall(): [string, RequestInit] {
  return vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("tasks", () => {
  it("lists tasks", async () => {
    mockFetchOnce([{ id: "1" }]);
    const result = await apiClient.tasks.list();
    expect(lastCall()[0]).toBe(`${DEFAULT_API_BASE_URL}/tasks`);
    expect(lastCall()[1].method).toBe("GET");
    expect(result).toEqual([{ id: "1" }]);
  });

  it("gets one task by id", async () => {
    mockFetchOnce({ id: "1" });
    await apiClient.tasks.get("1");
    expect(lastCall()[0]).toBe(`${DEFAULT_API_BASE_URL}/tasks/1`);
    expect(lastCall()[1].method).toBe("GET");
  });

  it("creates a task, sending only the supplied fields", async () => {
    mockFetchOnce({ id: "1" }, 201);
    await apiClient.tasks.create({ title: "Build UI", description: "..." });
    const [url, init] = lastCall();
    expect(url).toBe(`${DEFAULT_API_BASE_URL}/tasks`);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(
      JSON.stringify({ title: "Build UI", description: "..." }),
    );
  });

  it("patches a task", async () => {
    mockFetchOnce({ id: "1", status: "DONE" });
    await apiClient.tasks.patch("1", { status: "DONE" });
    const [url, init] = lastCall();
    expect(url).toBe(`${DEFAULT_API_BASE_URL}/tasks/1`);
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ status: "DONE" }));
  });

  it("deletes a task", async () => {
    mockFetchOnce(null, 204);
    const result = await apiClient.tasks.delete("1");
    expect(lastCall()[0]).toBe(`${DEFAULT_API_BASE_URL}/tasks/1`);
    expect(lastCall()[1].method).toBe("DELETE");
    expect(result).toBeUndefined();
  });
});

describe("developers", () => {
  it("lists developers", async () => {
    mockFetchOnce([]);
    await apiClient.developers.list();
    expect(lastCall()[0]).toBe(`${DEFAULT_API_BASE_URL}/developers`);
  });

  it("creates a developer", async () => {
    mockFetchOnce({ id: "1" }, 201);
    await apiClient.developers.create({ name: "Ada" });
    const [url, init] = lastCall();
    expect(url).toBe(`${DEFAULT_API_BASE_URL}/developers`);
    expect(init.body).toBe(JSON.stringify({ name: "Ada" }));
  });

  it("patches a developer", async () => {
    mockFetchOnce({ id: "1" });
    await apiClient.developers.patch("1", { skillIds: ["s1"] });
    expect(lastCall()[0]).toBe(`${DEFAULT_API_BASE_URL}/developers/1`);
  });

  it("deletes a developer", async () => {
    mockFetchOnce(null, 204);
    await apiClient.developers.delete("1");
    expect(lastCall()[1].method).toBe("DELETE");
  });
});

describe("skills", () => {
  it("lists skills", async () => {
    mockFetchOnce([]);
    await apiClient.skills.list();
    expect(lastCall()[0]).toBe(`${DEFAULT_API_BASE_URL}/skills`);
  });

  it("creates a skill", async () => {
    mockFetchOnce({ id: "1" }, 201);
    await apiClient.skills.create({
      name: "React",
      description: "UI library",
      categoryId: "c1",
    });
    const [, init] = lastCall();
    expect(init.body).toBe(
      JSON.stringify({
        name: "React",
        description: "UI library",
        categoryId: "c1",
      }),
    );
  });

  it("deletes a skill and surfaces the IN_USE conflict", async () => {
    mockFetchOnce(
      { error: { code: "IN_USE", message: "Skill is required by a task." } },
      409,
    );
    await expect(apiClient.skills.delete("1")).rejects.toMatchObject({
      code: "IN_USE",
    });
  });
});

describe("categories", () => {
  it("lists categories", async () => {
    mockFetchOnce([]);
    await apiClient.categories.list();
    expect(lastCall()[0]).toBe(`${DEFAULT_API_BASE_URL}/categories`);
  });

  it("gets one category", async () => {
    mockFetchOnce({ id: "1" });
    await apiClient.categories.get("1");
    expect(lastCall()[0]).toBe(`${DEFAULT_API_BASE_URL}/categories/1`);
  });
});

describe("agentTask", () => {
  it("orchestrates a conversation through the single endpoint", async () => {
    mockFetchOnce({
      status: "needs_clarification",
      question: "Which platform?",
    });
    await apiClient.agentTask.orchestrate({
      messages: [{ role: "user", content: "Build a demo app." }],
    });
    const [url, init] = lastCall();
    expect(url).toBe(`${DEFAULT_API_BASE_URL}/agent-task`);
    expect(init.body).toBe(
      JSON.stringify({
        messages: [{ role: "user", content: "Build a demo app." }],
      }),
    );
  });

  it("surfaces AGENT_UNAVAILABLE without leaking transport details", async () => {
    mockFetchOnce(
      {
        error: {
          code: "AGENT_UNAVAILABLE",
          message: "Agent planning is not configured.",
        },
      },
      503,
    );
    await expect(
      apiClient.agentTask.orchestrate({
        messages: [{ role: "user", content: "Build a demo app." }],
      }),
    ).rejects.toMatchObject({ code: "AGENT_UNAVAILABLE", status: 503 });
  });
});
