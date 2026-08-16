import { describe, expect, it } from "vitest";
import type { ApiErrorResponse } from "@repo/shared-types";
import { buildApp } from "../src/app.js";
import { DefaultHealthService } from "../src/services/health-service.js";
import { FakeHealthRepository } from "./lib/fake-health-repository.js";

function buildTestApp(healthRepository = new FakeHealthRepository()) {
  return buildApp(
    { healthService: new DefaultHealthService(healthRepository) },
    { logger: false },
  );
}

describe("app boot", () => {
  it("boots and serves a documented route with fake repositories injected", async () => {
    const app = buildTestApp();
    await app.ready();

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});

describe("contract-first request validation", () => {
  it("rejects a request that violates the OpenAPI schema before any handler runs", async () => {
    const app = buildTestApp();
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: { description: "Missing the required title." },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json() as ApiErrorResponse;
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("accepts a schema-valid request and only fails once it reaches unimplemented behavior", async () => {
    const app = buildTestApp();
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: { title: "Wire up assignment endpoint", description: "..." },
    });

    // Resource behavior is out of scope for this change; the route exists
    // and validates, but no service handler is wired up yet.
    expect(response.statusCode).toBe(500);
    const body = response.json() as ApiErrorResponse;
    expect(body.error.code).toBe("INTERNAL_ERROR");
  });
});

describe("internal error isolation", () => {
  it("never leaks the underlying failure's message or stack in the response", async () => {
    const app = buildTestApp(
      new FakeHealthRepository(async () => {
        throw new Error("connection refused: postgres://internal-host:5432");
      }),
    );
    await app.ready();

    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(500);
    const body = response.json() as ApiErrorResponse;
    expect(body.error).toEqual({
      code: "INTERNAL_ERROR",
      message: "An unexpected server error occurred.",
    });
    expect(response.body).not.toContain("postgres://");
    expect(response.body).not.toContain("connection refused");
    expect(response.body).not.toContain("stack");
  });
});
