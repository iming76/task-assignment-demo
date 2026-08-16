import { afterAll, beforeEach, describe, expect, it } from "vitest";
import type {
  AgentTaskCreatedResponse,
  ApiErrorResponse,
} from "@repo/shared-types";
import { buildApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import {
  PrismaTaskRepository,
  type CreateTaskRecord,
  type TaskRepository,
} from "../src/lib/repositories/task-repository.js";
import { PrismaDeveloperRepository } from "../src/lib/repositories/developer-repository.js";
import { PrismaSkillRepository } from "../src/lib/repositories/skill-repository.js";
import { PrismaCategoryRepository } from "../src/lib/repositories/category-repository.js";
import {
  PrismaTransactionRunner,
  type TransactionClient,
} from "../src/lib/transaction.js";
import { createTaskService } from "../src/services/task-service.js";
import { createDeveloperService } from "../src/services/developer-service.js";
import { createSkillService } from "../src/services/skill-service.js";
import { createCategoryService } from "../src/services/category-service.js";
import { createHealthService } from "../src/services/health-service.js";
import { createAgentTaskService } from "../src/services/agent-task-service.js";
import {
  AgentOrchestrationProviderError,
  NotConfiguredAgentOrchestrationProvider,
  type AgentOrchestrationProvider,
} from "../src/lib/agent-orchestration/agent-orchestration-provider.js";
import { FakeHealthRepository } from "./lib/fake-health-repository.js";
import { FakeAgentOrchestrationProvider } from "./lib/fake-agent-orchestration-provider.js";
import { seedApplicationData } from "../prisma/seed.js";
import { applicationSeedIds } from "../prisma/seed-ids.js";
import type { PatchTaskInput } from "@repo/shared-types";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "task_skills", "developer_skills", "tasks", "skills", "categories", "developers" RESTART IDENTITY CASCADE`,
  );
}

function node(overrides: Record<string, unknown> = {}) {
  return {
    title: "Root task",
    description: "Create the requested feature.",
    requiredSkillIds: [applicationSeedIds.skills.react],
    requiredRole: "Frontend Engineer",
    unmatchedSkillRequirements: [],
    subtasks: [],
    ...overrides,
  };
}

function buildTestApp(
  options: {
    provider?: AgentOrchestrationProvider;
    taskRepository?: TaskRepository;
  } = {},
) {
  const developerRepository = new PrismaDeveloperRepository(prisma);
  const skillRepository = new PrismaSkillRepository(prisma);
  const taskRepository =
    options.taskRepository ?? new PrismaTaskRepository(prisma);
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
        options.provider ?? new NotConfiguredAgentOrchestrationProvider(),
        skillRepository,
        developerRepository,
        taskRepository,
        new PrismaTransactionRunner(prisma),
      ),
    },
    { logger: false },
  );
}

class FailOnTitleTaskRepository implements TaskRepository {
  constructor(
    private readonly inner: TaskRepository,
    private readonly title: string,
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
  create(input: CreateTaskRecord, tx?: TransactionClient) {
    if (input.title === this.title) throw new Error("forced write failure");
    return this.inner.create(input, tx);
  }
  update(id: string, input: PatchTaskInput, tx?: TransactionClient) {
    return this.inner.update(id, input, tx);
  }
  delete(id: string, tx?: TransactionClient) {
    return this.inner.delete(id, tx);
  }
  countActiveAssignmentsByDeveloper(tx: TransactionClient) {
    return this.inner.countActiveAssignmentsByDeveloper(tx);
  }
  findAncestorIds(id: string, tx: TransactionClient) {
    return this.inner.findAncestorIds(id, tx);
  }
  findDescendantIds(id: string, tx: TransactionClient) {
    return this.inner.findDescendantIds(id, tx);
  }
  lockAndGetStatuses(ids: string[], tx: TransactionClient) {
    return this.inner.lockAndGetStatuses(ids, tx);
  }
}

describe("agent orchestration api", () => {
  beforeEach(async () => {
    await resetDatabase();
    await seedApplicationData(prisma);
  });
  afterAll(resetDatabase);

  it("returns clarification without writing tasks", async () => {
    const provider = new FakeAgentOrchestrationProvider(async () => ({
      decision: {
        action: "ask_clarification",
        question: "Which profile fields?",
      },
      skillCatalogListed: false,
    }));
    const app = buildTestApp({ provider });
    const response = await app.inject({
      method: "POST",
      url: "/agent-task",
      payload: { messages: [{ role: "user", content: "Update profiles." }] },
    });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "needs_clarification",
      question: "Which profile fields?",
    });
    expect(await prisma.task.count()).toBe(0);
  });

  it("creates a recursive tree and assigns by exact skills and workload", async () => {
    await prisma.task.create({
      data: {
        title: "Ada's active work",
        description: "Existing work",
        assigneeId: applicationSeedIds.developers.adaLovelace,
      },
    });
    const provider = new FakeAgentOrchestrationProvider(async () => ({
      decision: {
        action: "create_task_tree",
        tasks: [
          node({
            subtasks: [node({ title: "Child task", requiredSkillIds: [] })],
          }),
        ],
      },
      skillCatalogListed: true,
    }));
    const app = buildTestApp({ provider });
    const response = await app.inject({
      method: "POST",
      url: "/agent-task",
      payload: {
        messages: [{ role: "user", content: "Build a React feature." }],
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json() as AgentTaskCreatedResponse;
    expect(body.status).toBe("created");
    expect(body.tasks).toHaveLength(2);
    expect(body.tasks[0].assigneeId).toBe(
      applicationSeedIds.developers.graceHopper,
    );
    expect(body.tasks[1].parentTaskId).toBe(body.tasks[0].id);
    expect(body.staffingGaps).toEqual([]);
  });

  it("counts only active assigned tasks for workload ranking", async () => {
    await prisma.task.createMany({
      data: [
        {
          title: "Active Ada 1",
          description: "Work",
          assigneeId: applicationSeedIds.developers.adaLovelace,
        },
        {
          title: "Active Ada 2",
          description: "Work",
          assigneeId: applicationSeedIds.developers.adaLovelace,
        },
        {
          title: "Done Grace",
          description: "Work",
          status: "DONE",
          assigneeId: applicationSeedIds.developers.graceHopper,
        },
        { title: "Unassigned", description: "Work" },
      ],
    });
    const repository = new PrismaTaskRepository(prisma);
    const counts = await prisma.$transaction((tx) =>
      repository.countActiveAssignmentsByDeveloper(tx),
    );
    expect(counts).toEqual(
      new Map([[applicationSeedIds.developers.adaLovelace, 2]]),
    );
  });

  it("creates unassigned AI work and reports the required role", async () => {
    const aiSkillId = "a0000000-0000-4000-8000-000000000105";
    await prisma.skill.create({
      data: {
        id: aiSkillId,
        name: "Artificial Intelligence",
        description: "Machine-learning systems.",
        categoryId: applicationSeedIds.categories.backend,
      },
    });
    const provider = new FakeAgentOrchestrationProvider(async () => ({
      decision: {
        action: "create_task_tree",
        tasks: [
          node({
            title: "AI image moderation",
            requiredSkillIds: [aiSkillId],
            requiredRole: "AI Engineer",
          }),
        ],
      },
      skillCatalogListed: true,
    }));
    const response = await buildTestApp({ provider }).inject({
      method: "POST",
      url: "/agent-task",
      payload: {
        messages: [
          { role: "user", content: "Moderate profile images with AI." },
        ],
      },
    });
    expect(response.statusCode).toBe(201);
    const body = response.json() as AgentTaskCreatedResponse;
    expect(body.tasks[0].assigneeId).toBeNull();
    expect(body.staffingGaps[0]).toMatchObject({
      taskTitle: "AI image moderation",
      requiredRole: "AI Engineer",
      requiredSkillIds: [aiSkillId],
    });
    expect(body.message).toContain("requires AI Engineer");
  });

  it("rejects creation without catalog inspection", async () => {
    const provider = new FakeAgentOrchestrationProvider(async () => ({
      decision: { action: "create_task_tree", tasks: [node()] },
      skillCatalogListed: false,
    }));
    const response = await buildTestApp({ provider }).inject({
      method: "POST",
      url: "/agent-task",
      payload: { messages: [{ role: "user", content: "Build React." }] },
    });
    expect(response.statusCode).toBe(503);
    expect(await prisma.task.count()).toBe(0);
  });

  it("rejects agent-created trees deeper than three levels", async () => {
    const provider = new FakeAgentOrchestrationProvider(async () => ({
      decision: {
        action: "create_task_tree",
        tasks: [
          node({
            subtasks: [
              node({
                subtasks: [node({ subtasks: [node({ title: "Too deep" })] })],
              }),
            ],
          }),
        ],
      },
      skillCatalogListed: true,
    }));

    const response = await buildTestApp({ provider }).inject({
      method: "POST",
      url: "/agent-task",
      payload: { messages: [{ role: "user", content: "Build React." }] },
    });

    expect(response.statusCode).toBe(400);
    expect((response.json() as ApiErrorResponse).error.code).toBe(
      "VALIDATION_ERROR",
    );
    expect(await prisma.task.count()).toBe(0);
  });

  it("rejects unknown skill ids and rolls back failed trees", async () => {
    const invalidProvider = new FakeAgentOrchestrationProvider(async () => ({
      decision: {
        action: "create_task_tree",
        tasks: [node({ requiredSkillIds: ["unknown-skill"] })],
      },
      skillCatalogListed: true,
    }));
    const invalidResponse = await buildTestApp({
      provider: invalidProvider,
    }).inject({
      method: "POST",
      url: "/agent-task",
      payload: { messages: [{ role: "user", content: "Build React." }] },
    });
    expect(invalidResponse.statusCode).toBe(503);
    expect(await prisma.task.count()).toBe(0);

    const provider = new FakeAgentOrchestrationProvider(async () => ({
      decision: {
        action: "create_task_tree",
        tasks: [node({ subtasks: [node({ title: "Fail child" })] })],
      },
      skillCatalogListed: true,
    }));
    const failingRepository = new FailOnTitleTaskRepository(
      new PrismaTaskRepository(prisma),
      "Fail child",
    );
    const failedResponse = await buildTestApp({
      provider,
      taskRepository: failingRepository,
    }).inject({
      method: "POST",
      url: "/agent-task",
      payload: { messages: [{ role: "user", content: "Build React." }] },
    });
    expect(failedResponse.statusCode).toBe(500);
    expect(await prisma.task.count()).toBe(0);
  });

  it("validates conversations, maps provider failure, and removes legacy routes", async () => {
    const app = buildTestApp({
      provider: new FakeAgentOrchestrationProvider(async () => {
        throw new AgentOrchestrationProviderError("timeout");
      }),
    });
    const invalid = await app.inject({
      method: "POST",
      url: "/agent-task",
      payload: { messages: [] },
    });
    expect(invalid.statusCode).toBe(400);
    const unavailable = await app.inject({
      method: "POST",
      url: "/agent-task",
      payload: { messages: [{ role: "user", content: "Build it." }] },
    });
    expect(unavailable.statusCode).toBe(503);
    expect((unavailable.json() as ApiErrorResponse).error.code).toBe(
      "AGENT_UNAVAILABLE",
    );
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/agent-task/proposals",
          payload: {},
        })
      ).statusCode,
    ).toBe(404);
    expect(
      (
        await app.inject({
          method: "POST",
          url: "/agent-task/apply",
          payload: {},
        })
      ).statusCode,
    ).toBe(404);
  });
});
