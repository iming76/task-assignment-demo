import { describe, it, expect, beforeEach, afterAll } from "vitest";
import type { ApiErrorResponse, Task } from "@repo/shared-types";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import {
  PrismaTaskRepository,
  type CreateTaskRecord,
  type TaskRepository,
} from "../src/lib/repositories/task-repository.js";
import { createTaskService } from "../src/services/task-service.js";
import { PrismaDeveloperRepository } from "../src/lib/repositories/developer-repository.js";
import { createDeveloperService } from "../src/services/developer-service.js";
import { PrismaSkillRepository } from "../src/lib/repositories/skill-repository.js";
import { createSkillService } from "../src/services/skill-service.js";
import { PrismaCategoryRepository } from "../src/lib/repositories/category-repository.js";
import { createCategoryService } from "../src/services/category-service.js";
import { createHealthService } from "../src/services/health-service.js";
import { PrismaTransactionRunner } from "../src/lib/transaction.js";
import type { TransactionClient } from "../src/lib/transaction.js";
import type { PatchTaskInput } from "@repo/shared-types";
import { FakeHealthRepository } from "./lib/fake-health-repository.js";
import { FakeTaskPlanningProvider } from "./lib/fake-task-planning-provider.js";
import { createAgentTaskService } from "../src/services/agent-task-service.js";
import {
  NotConfiguredTaskPlanningProvider,
  TaskPlanningProviderError,
  type TaskPlanningProvider,
} from "../src/lib/task-planning/task-planning-provider.js";
import { seedApplicationData } from "../prisma/seed.js";
import { applicationSeedIds } from "../prisma/seed-ids.js";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "task_skills", "developer_skills", "tasks", "skills", "categories", "developers" RESTART IDENTITY CASCADE`,
  );
}

function buildTestApp(
  options: {
    provider?: TaskPlanningProvider;
    taskRepository?: TaskRepository;
  } = {},
) {
  const developerRepository = new PrismaDeveloperRepository(prisma);
  const skillRepository = new PrismaSkillRepository(prisma);
  const taskRepository =
    options.taskRepository ?? new PrismaTaskRepository(prisma);
  const provider = options.provider ?? new NotConfiguredTaskPlanningProvider();

  return buildApp(
    {
      healthService: createHealthService(new FakeHealthRepository()),
      taskService: createTaskService(
        taskRepository,
        developerRepository,
        skillRepository,
        new PrismaTransactionRunner(prisma),
      ),
      developerService: createDeveloperService(developerRepository),
      skillService: createSkillService(skillRepository),
      categoryService: createCategoryService(
        new PrismaCategoryRepository(prisma),
      ),
      agentTaskService: createAgentTaskService(
        provider,
        skillRepository,
        developerRepository,
        taskRepository,
        new PrismaTransactionRunner(prisma),
      ),
    },
    { logger: false },
  );
}

/** Delegates to a real repository but forces `create` to fail for one title, to prove apply rolls back atomically. */
class FailOnTitleTaskRepository implements TaskRepository {
  constructor(
    private readonly inner: TaskRepository,
    private readonly failTitle: string,
  ) {}

  list() {
    return this.inner.list();
  }

  findById(id: string, tx?: TransactionClient) {
    return this.inner.findById(id, tx);
  }

  hasChildren(id: string, tx?: TransactionClient) {
    return this.inner.hasChildren(id, tx);
  }

  async create(input: CreateTaskRecord, tx?: TransactionClient) {
    if (input.title === this.failTitle) {
      throw new Error("forced failure for rollback test");
    }
    return this.inner.create(input, tx);
  }

  update(id: string, input: PatchTaskInput, tx?: TransactionClient) {
    return this.inner.update(id, input, tx);
  }

  delete(id: string, tx?: TransactionClient) {
    return this.inner.delete(id, tx);
  }
}

const unknownId = "00000000-0000-4000-8000-999999999999";

describe("agent planning api", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedApplicationData(prisma);
  });

  afterAll(async () => {
    await resetDatabase();
  });

  describe("POST /agent-task/proposals", () => {
    it("returns a valid multi-root three-level draft without persisting anything", async () => {
      const draft = [
        {
          name: "Root A",
          description: "First root.",
          requiredSkillIds: [
            applicationSeedIds.skills.react,
            applicationSeedIds.skills.typescript,
          ],
          assigneeId: applicationSeedIds.developers.adaLovelace,
          subtasks: [
            {
              name: "Child A1",
              description: "First child.",
              requiredSkillIds: [],
              subtasks: [
                {
                  name: "Grandchild A1a",
                  description: "Deepest task.",
                  requiredSkillIds: [],
                  subtasks: [],
                },
              ],
            },
          ],
        },
        {
          name: "Root B",
          description: "Second root.",
          requiredSkillIds: [],
          subtasks: [],
        },
      ];
      const app = buildTestApp({
        provider: new FakeTaskPlanningProvider(async () => draft),
      });
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/agent-task/proposals",
        payload: { description: "Build a task assignment system." },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json() as {
        tasks: Array<{
          name: string;
          assigneeId: string | null;
          subtasks: Array<{ subtasks: Array<{ name: string }> }>;
        }>;
      };
      expect(body.tasks).toHaveLength(2);
      expect(body.tasks[0].name).toBe("Root A");
      expect(body.tasks[0].assigneeId).toBe(
        applicationSeedIds.developers.adaLovelace,
      );
      expect(body.tasks[0].subtasks[0].subtasks[0].name).toBe("Grandchild A1a");

      const tasksResponse = await app.inject({ method: "GET", url: "/tasks" });
      expect(tasksResponse.json()).toEqual([]);
    });

    it("clears an assignee that does not cover the full required-skill set", async () => {
      const draft = [
        {
          name: "Full-stack task",
          description: "Needs Node.js and PostgreSQL.",
          requiredSkillIds: [
            applicationSeedIds.skills.nodejs,
            applicationSeedIds.skills.postgresql,
          ],
          assigneeId: applicationSeedIds.developers.alanTuring,
          subtasks: [],
        },
      ];
      const app = buildTestApp({
        provider: new FakeTaskPlanningProvider(async () => draft),
      });
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/agent-task/proposals",
        payload: { description: "..." },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json() as {
        tasks: Array<{ assigneeId: string | null }>;
      };
      expect(body.tasks[0].assigneeId).toBeNull();
    });

    it("returns AGENT_UNAVAILABLE when no provider is configured", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/agent-task/proposals",
        payload: { description: "..." },
      });

      expect(response.statusCode).toBe(503);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "AGENT_UNAVAILABLE",
      );
    });

    it("returns AGENT_UNAVAILABLE when the provider times out", async () => {
      const app = buildTestApp({
        provider: new FakeTaskPlanningProvider(async () => {
          throw new TaskPlanningProviderError(
            "Agent planning provider timed out.",
          );
        }),
      });
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/agent-task/proposals",
        payload: { description: "..." },
      });

      expect(response.statusCode).toBe(503);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "AGENT_UNAVAILABLE",
      );
    });

    it("returns AGENT_UNAVAILABLE when the provider output is malformed", async () => {
      const app = buildTestApp({
        provider: new FakeTaskPlanningProvider(async () => ({
          not: "a draft",
        })),
      });
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/agent-task/proposals",
        payload: { description: "..." },
      });

      expect(response.statusCode).toBe(503);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "AGENT_UNAVAILABLE",
      );
    });

    it("returns AGENT_UNAVAILABLE when the draft references an unknown skill id", async () => {
      const app = buildTestApp({
        provider: new FakeTaskPlanningProvider(async () => [
          {
            name: "Task",
            description: "Uses a skill id the catalog does not have.",
            requiredSkillIds: [unknownId],
            subtasks: [],
          },
        ]),
      });
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/agent-task/proposals",
        payload: { description: "..." },
      });

      expect(response.statusCode).toBe(503);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "AGENT_UNAVAILABLE",
      );
    });

    it("returns VALIDATION_ERROR for an empty description", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/agent-task/proposals",
        payload: { description: "" },
      });

      expect(response.statusCode).toBe(400);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "VALIDATION_ERROR",
      );
    });
  });

  describe("POST /agent-task/apply", () => {
    function editedDraft(overrides: Record<string, unknown> = {}) {
      return [
        {
          name: "Root",
          description: "Reviewed and edited root task.",
          requiredSkillIds: [
            applicationSeedIds.skills.react,
            applicationSeedIds.skills.typescript,
          ],
          assigneeId: applicationSeedIds.developers.adaLovelace,
          subtasks: [
            {
              name: "Child",
              description: "Reviewed child task.",
              requiredSkillIds: [],
              subtasks: [],
            },
          ],
          ...overrides,
        },
      ];
    }

    it("creates the complete reviewed tree from edited input", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/agent-task/apply",
        payload: { tasks: editedDraft() },
      });

      expect(response.statusCode).toBe(201);
      const created = response.json() as Task[];
      expect(created).toHaveLength(2);
      const [root, child] = created;
      expect(root.title).toBe("Root");
      expect(root.parentTaskId).toBeNull();
      expect(root.depth).toBe(1);
      expect(root.assigneeId).toBe(applicationSeedIds.developers.adaLovelace);
      expect(root.status).toBe("TODO");
      expect(child.title).toBe("Child");
      expect(child.parentTaskId).toBe(root.id);
      expect(child.depth).toBe(2);

      const tasksResponse = await app.inject({ method: "GET", url: "/tasks" });
      expect((tasksResponse.json() as Task[]).length).toBe(2);
    });

    it("returns NOT_FOUND for a stale/unknown required skill id", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/agent-task/apply",
        payload: {
          tasks: editedDraft({
            requiredSkillIds: [unknownId],
            assigneeId: null,
          }),
        },
      });

      expect(response.statusCode).toBe(404);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "NOT_FOUND",
      );

      const tasksResponse = await app.inject({ method: "GET", url: "/tasks" });
      expect(tasksResponse.json()).toEqual([]);
    });

    it("returns NOT_FOUND for a stale/unknown assignee id", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/agent-task/apply",
        payload: { tasks: editedDraft({ assigneeId: unknownId }) },
      });

      expect(response.statusCode).toBe(404);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "NOT_FOUND",
      );
    });

    it("returns SKILL_MISMATCH when the assignee does not cover required skills", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/agent-task/apply",
        payload: {
          tasks: editedDraft({
            requiredSkillIds: [applicationSeedIds.skills.postgresql],
            assigneeId: applicationSeedIds.developers.alanTuring,
          }),
        },
      });

      expect(response.statusCode).toBe(409);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "SKILL_MISMATCH",
      );

      const tasksResponse = await app.inject({ method: "GET", url: "/tasks" });
      expect(tasksResponse.json()).toEqual([]);
    });

    it("rolls back the entire tree when a write fails partway through", async () => {
      const app = buildTestApp({
        taskRepository: new FailOnTitleTaskRepository(
          new PrismaTaskRepository(prisma),
          "Child",
        ),
      });
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/agent-task/apply",
        payload: { tasks: editedDraft() },
      });

      expect(response.statusCode).toBe(500);

      const tasksResponse = await app.inject({ method: "GET", url: "/tasks" });
      expect(tasksResponse.json()).toEqual([]);
    });
  });
});
