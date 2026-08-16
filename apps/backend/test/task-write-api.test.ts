import { describe, it, expect, beforeEach, afterAll } from "vitest";
import type { ApiErrorResponse, Task } from "@repo/shared-types";
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
import { seedApplicationData } from "../prisma/seed.js";
import { applicationSeedIds } from "../prisma/seed-ids.js";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "task_skills", "developer_skills", "tasks", "skills", "categories", "developers" RESTART IDENTITY CASCADE`,
  );
}

function buildTestApp() {
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

const unknownId = "00000000-0000-4000-8000-999999999999";

describe("task write api", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedApplicationData(prisma);
  });

  afterAll(async () => {
    await resetDatabase();
  });

  describe("POST /tasks", () => {
    it("creates a root task with supplied required skills", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/tasks",
        payload: {
          title: "Wire up assignment endpoint",
          description: "Add the endpoint and enforce skill eligibility.",
          requiredSkillIds: [applicationSeedIds.skills.react],
        },
      });

      expect(response.statusCode).toBe(201);
      const task = response.json() as Task;
      expect(task.status).toBe("TODO");
      expect(task.assigneeId).toBeNull();
      expect(task.parentTaskId).toBeNull();
      expect(task.depth).toBe(1);
      expect(task.requiredSkillIds).toEqual([applicationSeedIds.skills.react]);
    });

    it("falls back to an empty required-skill set when the field is omitted", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/tasks",
        payload: { title: "Untagged task", description: "No skills given." },
      });

      expect(response.statusCode).toBe(201);
      const task = response.json() as Task;
      expect(task.requiredSkillIds).toEqual([]);
    });

    it("creates a child task one depth below its parent", async () => {
      const app = buildTestApp();
      await app.ready();

      const rootResponse = await app.inject({
        method: "POST",
        url: "/tasks",
        payload: { title: "Root", description: "Root task." },
      });
      const root = rootResponse.json() as Task;

      const childResponse = await app.inject({
        method: "POST",
        url: "/tasks",
        payload: {
          title: "Child",
          description: "Child task.",
          parentTaskId: root.id,
        },
      });

      expect(childResponse.statusCode).toBe(201);
      const child = childResponse.json() as Task;
      expect(child.parentTaskId).toBe(root.id);
      expect(child.depth).toBe(root.depth + 1);
    });

    it("returns NOT_FOUND for an unknown parentTaskId", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/tasks",
        payload: {
          title: "Orphan",
          description: "Points at nothing.",
          parentTaskId: unknownId,
        },
      });

      expect(response.statusCode).toBe(404);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "NOT_FOUND",
      );
    });

    it("returns NOT_FOUND for an unknown requiredSkillIds entry", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/tasks",
        payload: {
          title: "Mistagged",
          description: "Bad skill id.",
          requiredSkillIds: [unknownId],
        },
      });

      expect(response.statusCode).toBe(404);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "NOT_FOUND",
      );
    });
  });

  describe("PATCH /tasks/:id", () => {
    async function createTask(
      app: ReturnType<typeof buildTestApp>,
      overrides: Record<string, unknown> = {},
    ): Promise<Task> {
      const response = await app.inject({
        method: "POST",
        url: "/tasks",
        payload: {
          title: "Task",
          description: "Description.",
          requiredSkillIds: [applicationSeedIds.skills.react],
          ...overrides,
        },
      });
      return response.json() as Task;
    }

    it("updates title and description", async () => {
      const app = buildTestApp();
      await app.ready();
      const task = await createTask(app);

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { title: "Renamed" },
      });

      expect(response.statusCode).toBe(200);
      expect((response.json() as Task).title).toBe("Renamed");
    });

    it("assigns a developer whose skills cover the required skills", async () => {
      const app = buildTestApp();
      await app.ready();
      const task = await createTask(app, {
        requiredSkillIds: [
          applicationSeedIds.skills.react,
          applicationSeedIds.skills.typescript,
        ],
      });

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { assigneeId: applicationSeedIds.developers.adaLovelace },
      });

      expect(response.statusCode).toBe(200);
      expect((response.json() as Task).assigneeId).toBe(
        applicationSeedIds.developers.adaLovelace,
      );
    });

    it("rejects assignment when the developer is missing a required skill", async () => {
      const app = buildTestApp();
      await app.ready();
      const task = await createTask(app, {
        requiredSkillIds: [applicationSeedIds.skills.postgresql],
      });

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { assigneeId: applicationSeedIds.developers.alanTuring },
      });

      expect(response.statusCode).toBe(409);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "SKILL_MISMATCH",
      );
    });

    it("rejects a required-skill replacement that would invalidate the current assignee, without unassigning", async () => {
      const app = buildTestApp();
      await app.ready();
      const task = await createTask(app, {
        requiredSkillIds: [applicationSeedIds.skills.nodejs],
      });
      await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { assigneeId: applicationSeedIds.developers.alanTuring },
      });

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: {
          requiredSkillIds: [applicationSeedIds.skills.postgresql],
        },
      });

      expect(response.statusCode).toBe(409);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "SKILL_MISMATCH",
      );

      const stateResponse = await app.inject({
        method: "GET",
        url: `/tasks/${task.id}`,
      });
      const state = stateResponse.json() as Task;
      expect(state.assigneeId).toBe(applicationSeedIds.developers.alanTuring);
      expect(state.requiredSkillIds).toEqual([
        applicationSeedIds.skills.nodejs,
      ]);
    });

    it("explicitly unassigns a task", async () => {
      const app = buildTestApp();
      await app.ready();
      const task = await createTask(app);
      await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { assigneeId: applicationSeedIds.developers.adaLovelace },
      });

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { assigneeId: null },
      });

      expect(response.statusCode).toBe(200);
      expect((response.json() as Task).assigneeId).toBeNull();
    });

    it("allows assigning any developer to a task requiring zero skills", async () => {
      const app = buildTestApp();
      await app.ready();
      const task = await createTask(app, { requiredSkillIds: [] });

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { assigneeId: applicationSeedIds.developers.alanTuring },
      });

      expect(response.statusCode).toBe(200);
      expect((response.json() as Task).assigneeId).toBe(
        applicationSeedIds.developers.alanTuring,
      );
    });

    it("returns NOT_FOUND for an unknown task id", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${unknownId}`,
        payload: { title: "Ghost" },
      });

      expect(response.statusCode).toBe(404);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "NOT_FOUND",
      );
    });

    it("returns NOT_FOUND for an unknown assigneeId", async () => {
      const app = buildTestApp();
      await app.ready();
      const task = await createTask(app);

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { assigneeId: unknownId },
      });

      expect(response.statusCode).toBe(404);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "NOT_FOUND",
      );
    });

    it("returns NOT_FOUND for an unknown requiredSkillIds entry", async () => {
      const app = buildTestApp();
      await app.ready();
      const task = await createTask(app);

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { requiredSkillIds: [unknownId] },
      });

      expect(response.statusCode).toBe(404);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "NOT_FOUND",
      );
    });

    it("returns VALIDATION_ERROR for an empty patch body", async () => {
      const app = buildTestApp();
      await app.ready();
      const task = await createTask(app);

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: {},
      });

      expect(response.statusCode).toBe(400);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "VALIDATION_ERROR",
      );
    });
  });

  describe("DELETE /tasks/:id", () => {
    it("deletes a task with no children", async () => {
      const app = buildTestApp();
      await app.ready();

      const createResponse = await app.inject({
        method: "POST",
        url: "/tasks",
        payload: { title: "Leaf", description: "No children." },
      });
      const task = createResponse.json() as Task;

      const response = await app.inject({
        method: "DELETE",
        url: `/tasks/${task.id}`,
      });

      expect(response.statusCode).toBe(204);

      const getResponse = await app.inject({
        method: "GET",
        url: `/tasks/${task.id}`,
      });
      expect(getResponse.statusCode).toBe(404);
    });

    it("returns NOT_FOUND for an unknown task id", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "DELETE",
        url: `/tasks/${unknownId}`,
      });

      expect(response.statusCode).toBe(404);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "NOT_FOUND",
      );
    });

    it("returns IN_USE when the task still has subtasks", async () => {
      const app = buildTestApp();
      await app.ready();

      const rootResponse = await app.inject({
        method: "POST",
        url: "/tasks",
        payload: { title: "Root", description: "Has a child." },
      });
      const root = rootResponse.json() as Task;
      await app.inject({
        method: "POST",
        url: "/tasks",
        payload: {
          title: "Child",
          description: "Blocks parent deletion.",
          parentTaskId: root.id,
        },
      });

      const response = await app.inject({
        method: "DELETE",
        url: `/tasks/${root.id}`,
      });

      expect(response.statusCode).toBe(409);
      expect((response.json() as ApiErrorResponse).error.code).toBe("IN_USE");
    });
  });
});
