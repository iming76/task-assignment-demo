import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiClientError,
  DEFAULT_API_BASE_URL,
  getApiBaseUrl,
  request,
} from "./http";

function mockFetchOnce(response: Partial<Response>): void {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response as Response));
}

describe("getApiBaseUrl", () => {
  it("falls back to the local backend default when unset", () => {
    expect(getApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });
});

describe("request", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends no body or content-type header for a bodyless request", async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({ id: "1" }) });

    await request({ method: "GET", path: "/tasks" });

    expect(fetch).toHaveBeenCalledWith(`${DEFAULT_API_BASE_URL}/tasks`, {
      method: "GET",
      headers: undefined,
      body: undefined,
    });
  });

  it("omits properties that were never supplied instead of sending them as null", async () => {
    mockFetchOnce({ ok: true, status: 200, json: async () => ({}) });

    await request({
      method: "PATCH",
      path: "/tasks/1",
      body: { title: "New title", description: undefined },
    });

    const [, init] = vi.mocked(fetch).mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe('{"title":"New title"}');
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
  });

  it("returns undefined for a 204 response without parsing a body", async () => {
    const json = vi.fn();
    mockFetchOnce({ ok: true, status: 204, json });

    const result = await request({ method: "DELETE", path: "/tasks/1" });

    expect(result).toBeUndefined();
    expect(json).not.toHaveBeenCalled();
  });

  it("returns the parsed JSON payload on success", async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => [{ id: "1", name: "React" }],
    });

    const result = await request({ method: "GET", path: "/skills" });

    expect(result).toEqual([{ id: "1", name: "React" }]);
  });

  it("preserves the documented public code and message from an error envelope", async () => {
    mockFetchOnce({
      ok: false,
      status: 409,
      json: async () => ({
        error: {
          code: "SKILL_MISMATCH",
          message: "Assignee lacks a required skill.",
        },
      }),
    });

    await expect(
      request({ method: "PATCH", path: "/tasks/1" }),
    ).rejects.toMatchObject({
      code: "SKILL_MISMATCH",
      message: "Assignee lacks a required skill.",
      status: 409,
    });
  });

  it("falls back to a safe internal error when the failure body is not a documented envelope", async () => {
    mockFetchOnce({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("not json");
      },
    });

    await expect(
      request({ method: "GET", path: "/tasks" }),
    ).rejects.toMatchObject({
      code: "INTERNAL_ERROR",
      message: "An unexpected server error occurred.",
      status: 502,
    });
  });

  it("maps a network failure to a client-only error without a status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    const error = await request({ method: "GET", path: "/tasks" }).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({ code: "NETWORK_ERROR", status: null });
  });
});
