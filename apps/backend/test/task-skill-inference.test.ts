import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import type { Task } from "@repo/shared-types";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { PrismaTaskRepository } from "../src/lib/repositories/task-repository.js";
import { DefaultTaskService } from "../src/services/task-service.js";
import { PrismaDeveloperRepository } from "../src/lib/repositories/developer-repository.js";
import { DefaultDeveloperService } from "../src/services/developer-service.js";
import { PrismaSkillRepository } from "../src/lib/repositories/skill-repository.js";
import { DefaultSkillService } from "../src/services/skill-service.js";
import { PrismaCategoryRepository } from "../src/lib/repositories/category-repository.js";
import { DefaultCategoryService } from "../src/services/category-service.js";
import { DefaultHealthService } from "../src/services/health-service.js";
import { PrismaTransactionRunner } from "../src/lib/transaction.js";
import { FakeHealthRepository } from "./lib/fake-health-repository.js";
import { FakeSkillInferenceProvider } from "./lib/fake-skill-inference-provider.js";
import { DefaultSkillInferenceService } from "../src/lib/skill-inference/skill-inference-service.js";
import type { SkillInferenceProvider } from "../src/lib/skill-inference/skill-inference-provider.js";
import { NotConfiguredSkillInferenceProvider } from "../src/lib/skill-inference/skill-inference-provider.js";
import { seedApplicationData } from "../prisma/seed.js";
import { applicationSeedIds } from "../prisma/seed-ids.js";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "task_skills", "developer_skills", "tasks", "skills", "categories", "developers" RESTART IDENTITY CASCADE`,
  );
}

function buildTestApp(provider: SkillInferenceProvider) {
  const developerRepository = new PrismaDeveloperRepository(prisma);
  const skillRepository = new PrismaSkillRepository(prisma);
  return buildApp(
    {
      healthService: new DefaultHealthService(new FakeHealthRepository()),
      taskService: new DefaultTaskService(
        new PrismaTaskRepository(prisma),
        developerRepository,
        skillRepository,
        new PrismaTransactionRunner(prisma),
        new DefaultSkillInferenceService(provider, skillRepository),
      ),
      developerService: new DefaultDeveloperService(developerRepository),
      skillService: new DefaultSkillService(skillRepository),
      categoryService: new DefaultCategoryService(
        new PrismaCategoryRepository(prisma),
      ),
    },
    { logger: false },
  );
}

describe("task skill inference", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedApplicationData(prisma);
  });

  afterAll(async () => {
    await resetDatabase();
  });

  it("invokes inference and persists its result when requiredSkillIds is omitted", async () => {
    const provider = new FakeSkillInferenceProvider(async () => [
      applicationSeedIds.skills.react,
    ]);
    const app = buildTestApp(provider);
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: { title: "Build the login form", description: "React work." },
    });

    expect(response.statusCode).toBe(201);
    expect((response.json() as Task).requiredSkillIds).toEqual([
      applicationSeedIds.skills.react,
    ]);
    expect(provider.callCount).toBe(1);
  });

  it("skips inference when requiredSkillIds is explicitly an empty array", async () => {
    const provider = new FakeSkillInferenceProvider(async () => [
      applicationSeedIds.skills.react,
    ]);
    const app = buildTestApp(provider);
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: {
        title: "Untagged on purpose",
        description: "Explicit empty list.",
        requiredSkillIds: [],
      },
    });

    expect(response.statusCode).toBe(201);
    expect((response.json() as Task).requiredSkillIds).toEqual([]);
    expect(provider.callCount).toBe(0);
  });

  it("skips inference when requiredSkillIds is explicitly non-empty", async () => {
    const provider = new FakeSkillInferenceProvider(async () => [
      applicationSeedIds.skills.react,
    ]);
    const app = buildTestApp(provider);
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: {
        title: "Backend work",
        description: "Explicit skills given.",
        requiredSkillIds: [applicationSeedIds.skills.nodejs],
      },
    });

    expect(response.statusCode).toBe(201);
    expect((response.json() as Task).requiredSkillIds).toEqual([
      applicationSeedIds.skills.nodejs,
    ]);
    expect(provider.callCount).toBe(0);
  });

  it("never invokes inference during a patch, even when requiredSkillIds stays unset", async () => {
    const provider = new FakeSkillInferenceProvider(async () => [
      applicationSeedIds.skills.react,
    ]);
    const app = buildTestApp(provider);
    await app.ready();

    const createResponse = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: { title: "Task", description: "Description." },
    });
    const task = createResponse.json() as Task;
    provider.callCount = 0;

    const response = await app.inject({
      method: "PATCH",
      url: `/tasks/${task.id}`,
      payload: { title: "Renamed" },
    });

    expect(response.statusCode).toBe(200);
    expect(provider.callCount).toBe(0);
  });

  it("falls back to an untagged task without blocking creation when no provider is configured", async () => {
    const app = buildTestApp(new NotConfiguredSkillInferenceProvider());
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: { title: "Task", description: "No credentials configured." },
    });

    expect(response.statusCode).toBe(201);
    expect((response.json() as Task).requiredSkillIds).toEqual([]);
  });

  it("falls back to an untagged task when the provider returns an unknown skill id", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const unknownId = "00000000-0000-4000-8000-999999999999";
    const provider = new FakeSkillInferenceProvider(async () => [unknownId]);
    const app = buildTestApp(provider);
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: { title: "Task", description: "Provider hallucinated." },
    });

    expect(response.statusCode).toBe(201);
    expect((response.json() as Task).requiredSkillIds).toEqual([]);
  });

  it("still returns NOT_FOUND for an explicitly supplied unknown skill id, unlike an inferred one", async () => {
    const unknownId = "00000000-0000-4000-8000-999999999999";
    const provider = new FakeSkillInferenceProvider(async () => [unknownId]);
    const app = buildTestApp(provider);
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/tasks",
      payload: {
        title: "Task",
        description: "Explicit bad id.",
        requiredSkillIds: [unknownId],
      },
    });

    expect(response.statusCode).toBe(404);
    expect(provider.callCount).toBe(0);
  });
});
