import { describe, it, expect, beforeEach, afterAll } from "vitest";
import type { ApiErrorResponse, Task } from "@repo/shared-types";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { PrismaTaskRepository } from "../src/lib/repositories/task-repository.js";
import { createTaskService } from "../src/services/task-service.js";
import { PrismaDeveloperRepository } from "../src/lib/repositories/developer-repository.js";
import { createDeveloperService } from "../src/services/developer-service.js";
import { PrismaSkillRepository } from "../src/lib/repositories/skill-repository.js";
import { createSkillService } from "../src/services/skill-service.js";
import { PrismaCategoryRepository } from "../src/lib/repositories/category-repository.js";
import { createCategoryService } from "../src/services/category-service.js";
import { createHealthService } from "../src/services/health-service.js";
import { PrismaTransactionRunner } from "../src/lib/transaction.js";
import { FakeHealthRepository } from "./lib/fake-health-repository.js";
import { seedTestData } from "./fixtures/seed.js";
import { testSeedIds } from "./fixtures/seed-ids.js";

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
      healthService: createHealthService(new FakeHealthRepository()),
      taskService: createTaskService(
        new PrismaTaskRepository(prisma),
        developerRepository,
        skillRepository,
        new PrismaTransactionRunner(prisma),
      ),
      developerService: createDeveloperService(developerRepository),
      skillService: createSkillService(skillRepository),
      categoryService: createCategoryService(
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
    await seedTestData(prisma);
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
          requiredSkillIds: [testSeedIds.skills.react],
        },
      });

      expect(response.statusCode).toBe(201);
      const task = response.json() as Task;
      expect(task.status).toBe("TODO");
      expect(task.assigneeId).toBeNull();
      expect(task.parentTaskId).toBeNull();
      expect(task.depth).toBe(1);
      expect(task.requiredSkillIds).toEqual([testSeedIds.skills.react]);
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

    it("rejects creating a task deeper than three levels", async () => {
      const app = buildTestApp();
      await app.ready();

      const create = async (title: string, parentTaskId?: string) =>
        app.inject({
          method: "POST",
          url: "/tasks",
          payload: {
            title,
            description: `${title} task.`,
            ...(parentTaskId ? { parentTaskId } : {}),
          },
        });

      const root = (await create("Root")).json() as Task;
      const child = (await create("Child", root.id)).json() as Task;
      const grandchild = (await create("Grandchild", child.id)).json() as Task;
      const response = await create("Too deep", grandchild.id);

      expect(response.statusCode).toBe(400);
      expect((response.json() as ApiErrorResponse).error).toEqual({
        code: "VALIDATION_ERROR",
        message: "Tasks cannot be nested deeper than 3 levels",
      });
      expect(await prisma.task.count()).toBe(3);
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
          requiredSkillIds: [testSeedIds.skills.react],
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
          testSeedIds.skills.react,
          testSeedIds.skills.typescript,
        ],
      });

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { assigneeId: testSeedIds.developers.adaLovelace },
      });

      expect(response.statusCode).toBe(200);
      expect((response.json() as Task).assigneeId).toBe(
        testSeedIds.developers.adaLovelace,
      );
    });

    it("rejects assignment when the developer is missing a required skill", async () => {
      const app = buildTestApp();
      await app.ready();
      const task = await createTask(app, {
        requiredSkillIds: [testSeedIds.skills.postgresql],
      });

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { assigneeId: testSeedIds.developers.alanTuring },
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
        requiredSkillIds: [testSeedIds.skills.nodejs],
      });
      await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { assigneeId: testSeedIds.developers.alanTuring },
      });

      const response = await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: {
          requiredSkillIds: [testSeedIds.skills.postgresql],
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
      expect(state.assigneeId).toBe(testSeedIds.developers.alanTuring);
      expect(state.requiredSkillIds).toEqual([testSeedIds.skills.nodejs]);
    });

    it("explicitly unassigns a task", async () => {
      const app = buildTestApp();
      await app.ready();
      const task = await createTask(app);
      await app.inject({
        method: "PATCH",
        url: `/tasks/${task.id}`,
        payload: { assigneeId: testSeedIds.developers.adaLovelace },
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
        payload: { assigneeId: testSeedIds.developers.alanTuring },
      });

      expect(response.statusCode).toBe(200);
      expect((response.json() as Task).assigneeId).toBe(
        testSeedIds.developers.alanTuring,
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

  describe("completion and reopening invariants", () => {
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
          ...overrides,
        },
      });
      return response.json() as Task;
    }

    async function patchStatus(
      app: ReturnType<typeof buildTestApp>,
      id: string,
      status: "TODO" | "DONE",
    ) {
      return app.inject({
        method: "PATCH",
        url: `/tasks/${id}`,
        payload: { status },
      });
    }

    async function buildThreeLevelTree(app: ReturnType<typeof buildTestApp>) {
      const root = await createTask(app, { title: "Root" });
      const child = await createTask(app, {
        title: "Child",
        parentTaskId: root.id,
      });
      const grandchild = await createTask(app, {
        title: "Grandchild",
        parentTaskId: child.id,
      });
      return { root, child, grandchild };
    }

    it("rejects completing an ancestor while a grandchild is still TODO", async () => {
      const app = buildTestApp();
      await app.ready();
      const { root } = await buildThreeLevelTree(app);

      const response = await patchStatus(app, root.id, "DONE");

      expect(response.statusCode).toBe(409);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "SUBTASKS_INCOMPLETE",
      );
    });

    it("allows leaf-up completion across three levels", async () => {
      const app = buildTestApp();
      await app.ready();
      const { root, child, grandchild } = await buildThreeLevelTree(app);

      const grandchildDone = await patchStatus(app, grandchild.id, "DONE");
      expect(grandchildDone.statusCode).toBe(200);

      const childDone = await patchStatus(app, child.id, "DONE");
      expect(childDone.statusCode).toBe(200);

      const rootDone = await patchStatus(app, root.id, "DONE");
      expect(rootDone.statusCode).toBe(200);
      expect((rootDone.json() as Task).status).toBe("DONE");
    });

    it("allows root-down reopening and rejects reopening below a still-DONE ancestor", async () => {
      const app = buildTestApp();
      await app.ready();
      const { root, child, grandchild } = await buildThreeLevelTree(app);
      await patchStatus(app, grandchild.id, "DONE");
      await patchStatus(app, child.id, "DONE");
      await patchStatus(app, root.id, "DONE");

      const reopenGrandchildEarly = await patchStatus(
        app,
        grandchild.id,
        "TODO",
      );
      expect(reopenGrandchildEarly.statusCode).toBe(409);
      expect(
        (reopenGrandchildEarly.json() as ApiErrorResponse).error.code,
      ).toBe("COMPLETED_ANCESTOR");

      const reopenRoot = await patchStatus(app, root.id, "TODO");
      expect(reopenRoot.statusCode).toBe(200);

      const reopenChild = await patchStatus(app, child.id, "TODO");
      expect(reopenChild.statusCode).toBe(200);

      const reopenGrandchild = await patchStatus(app, grandchild.id, "TODO");
      expect(reopenGrandchild.statusCode).toBe(200);
      expect((reopenGrandchild.json() as Task).status).toBe("TODO");
    });

    it("rejects creating a child beneath a DONE parent", async () => {
      const app = buildTestApp();
      await app.ready();
      const root = await createTask(app, { title: "Root" });
      await patchStatus(app, root.id, "DONE");

      const response = await app.inject({
        method: "POST",
        url: "/tasks",
        payload: {
          title: "Late child",
          description: "Created after completion.",
          parentTaskId: root.id,
        },
      });

      expect(response.statusCode).toBe(409);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "COMPLETED_ANCESTOR",
      );
    });

    it("keeps an unchanged status patch idempotent even with an incomplete child", async () => {
      const app = buildTestApp();
      await app.ready();
      const root = await createTask(app, { title: "Root" });
      await createTask(app, { title: "Child", parentTaskId: root.id });

      const response = await patchStatus(app, root.id, "TODO");

      expect(response.statusCode).toBe(200);
      expect((response.json() as Task).status).toBe("TODO");
    });

    it("serializes a concurrent completion against a concurrent child creation without violating invariants", async () => {
      const app = buildTestApp();
      await app.ready();
      const root = await createTask(app, { title: "Root" });

      const [patchResponse, createResponse] = await Promise.all([
        patchStatus(app, root.id, "DONE"),
        app.inject({
          method: "POST",
          url: "/tasks",
          payload: {
            title: "Late child",
            description: "Racing the completion.",
            parentTaskId: root.id,
          },
        }),
      ]);

      const finalRoot = (
        await app.inject({ method: "GET", url: `/tasks/${root.id}` })
      ).json() as Task;

      if (patchResponse.statusCode === 200) {
        expect(createResponse.statusCode).toBe(409);
        expect((createResponse.json() as ApiErrorResponse).error.code).toBe(
          "COMPLETED_ANCESTOR",
        );
        expect(finalRoot.status).toBe("DONE");
      } else {
        expect(patchResponse.statusCode).toBe(409);
        expect((patchResponse.json() as ApiErrorResponse).error.code).toBe(
          "SUBTASKS_INCOMPLETE",
        );
        expect(createResponse.statusCode).toBe(201);
        expect(finalRoot.status).toBe("TODO");
      }
    });
  });
});
