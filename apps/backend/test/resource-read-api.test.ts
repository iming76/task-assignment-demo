import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type {
  ApiErrorResponse,
  Task,
  Developer,
  Skill,
  Category,
} from "@repo/shared-types";
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
import { FakeHealthRepository } from "./lib/fake-health-repository.js";
import { seedApplicationData } from "../prisma/seed.js";
import { PrismaTransactionRunner } from "../src/lib/transaction.js";

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

describe("resource read api", () => {
  beforeAll(async () => {
    // Seed the database with application data for tests
    await resetDatabase();
    await seedApplicationData(prisma);
  });

  afterAll(async () => {
    // Clean up after tests
    await resetDatabase();
  });

  describe("GET /tasks", () => {
    it("lists all tasks in deterministic order", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "GET",
        url: "/tasks",
      });

      expect(response.statusCode).toBe(200);
      const tasks = response.json() as Task[];
      expect(Array.isArray(tasks)).toBe(true);

      // Verify deterministic ordering: tasks should be sorted by ID ascending
      const ids = tasks.map((t) => t.id);
      const sortedIds = [...ids].sort();
      expect(ids).toEqual(sortedIds);

      // Verify flattened shapes: no Prisma relation objects
      for (const task of tasks) {
        expect(task).toHaveProperty("requiredSkillIds");
        expect(Array.isArray(task.requiredSkillIds)).toBe(true);
        // Verify requiredSkillIds is a flat array of strings, not relation objects
        for (const skillId of task.requiredSkillIds) {
          expect(typeof skillId).toBe("string");
        }
      }
    });
  });

  describe("GET /tasks/:id", () => {
    it("returns a task detail when it exists", async () => {
      const app = buildTestApp();
      await app.ready();

      // First list to find a task ID
      const listResponse = await app.inject({
        method: "GET",
        url: "/tasks",
      });
      const tasks = listResponse.json() as Task[];
      if (tasks.length === 0) {
        return;
      }

      const taskId = tasks[0].id;
      const response = await app.inject({
        method: "GET",
        url: `/tasks/${taskId}`,
      });

      expect(response.statusCode).toBe(200);
      const task = response.json() as Task;
      expect(task.id).toBe(taskId);
      expect(Array.isArray(task.requiredSkillIds)).toBe(true);
    });

    it("returns NOT_FOUND for unknown task ID", async () => {
      const app = buildTestApp();
      await app.ready();

      const unknownId = "00000000-0000-4000-8000-999999999999";
      const response = await app.inject({
        method: "GET",
        url: `/tasks/${unknownId}`,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json() as ApiErrorResponse;
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("GET /developers", () => {
    it("lists all developers in deterministic order", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "GET",
        url: "/developers",
      });

      expect(response.statusCode).toBe(200);
      const developers = response.json() as Developer[];
      expect(Array.isArray(developers)).toBe(true);

      // Verify deterministic ordering
      const ids = developers.map((d) => d.id);
      const sortedIds = [...ids].sort();
      expect(ids).toEqual(sortedIds);

      // Verify flattened shapes
      for (const developer of developers) {
        expect(Array.isArray(developer.skillIds)).toBe(true);
        // Verify skill IDs are sorted
        const skillIds = developer.skillIds;
        const sortedSkillIds = [...skillIds].sort();
        expect(skillIds).toEqual(sortedSkillIds);
      }
    });
  });

  describe("GET /developers/:id", () => {
    it("returns a developer detail when it exists", async () => {
      const app = buildTestApp();
      await app.ready();

      // List first to get an actual developer ID
      const listResponse = await app.inject({
        method: "GET",
        url: "/developers",
      });
      const developers = listResponse.json() as Developer[];
      if (developers.length === 0) {
        return;
      }

      const developerId = developers[0].id;
      const response = await app.inject({
        method: "GET",
        url: `/developers/${developerId}`,
      });

      expect(response.statusCode).toBe(200);
      const developer = response.json() as Developer;
      expect(developer.id).toBe(developerId);
      expect(Array.isArray(developer.skillIds)).toBe(true);
    });

    it("returns NOT_FOUND for unknown developer ID", async () => {
      const app = buildTestApp();
      await app.ready();

      const unknownId = "00000000-0000-4000-8000-999999999999";
      const response = await app.inject({
        method: "GET",
        url: `/developers/${unknownId}`,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json() as ApiErrorResponse;
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("GET /skills", () => {
    it("lists all skills in deterministic order", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "GET",
        url: "/skills",
      });

      expect(response.statusCode).toBe(200);
      const skills = response.json() as Skill[];
      expect(Array.isArray(skills)).toBe(true);

      // Verify deterministic ordering
      const ids = skills.map((s) => s.id);
      const sortedIds = [...ids].sort();
      expect(ids).toEqual(sortedIds);

      // Verify flattened shapes (no relation objects)
      for (const skill of skills) {
        expect(typeof skill.categoryId).toBe("string");
      }
    });
  });

  describe("GET /skills/:id", () => {
    it("returns a skill detail when it exists", async () => {
      const app = buildTestApp();
      await app.ready();

      // List first to get an actual skill ID
      const listResponse = await app.inject({
        method: "GET",
        url: "/skills",
      });
      const skills = listResponse.json() as Skill[];
      if (skills.length === 0) {
        return;
      }

      const skillId = skills[0].id;
      const response = await app.inject({
        method: "GET",
        url: `/skills/${skillId}`,
      });

      expect(response.statusCode).toBe(200);
      const skill = response.json() as Skill;
      expect(skill.id).toBe(skillId);
      expect(typeof skill.categoryId).toBe("string");
    });

    it("returns NOT_FOUND for unknown skill ID", async () => {
      const app = buildTestApp();
      await app.ready();

      const unknownId = "00000000-0000-4000-8000-999999999999";
      const response = await app.inject({
        method: "GET",
        url: `/skills/${unknownId}`,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json() as ApiErrorResponse;
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("GET /categories", () => {
    it("lists all categories in deterministic order", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "GET",
        url: "/categories",
      });

      expect(response.statusCode).toBe(200);
      const categories = response.json() as Category[];
      expect(Array.isArray(categories)).toBe(true);

      // Verify deterministic ordering
      const ids = categories.map((c) => c.id);
      const sortedIds = [...ids].sort();
      expect(ids).toEqual(sortedIds);
    });
  });

  describe("GET /categories/:id", () => {
    it("returns a category detail when it exists", async () => {
      const app = buildTestApp();
      await app.ready();

      // List first to get an actual category ID
      const listResponse = await app.inject({
        method: "GET",
        url: "/categories",
      });
      const categories = listResponse.json() as Category[];
      if (categories.length === 0) {
        return;
      }

      const categoryId = categories[0].id;
      const response = await app.inject({
        method: "GET",
        url: `/categories/${categoryId}`,
      });

      expect(response.statusCode).toBe(200);
      const category = response.json() as Category;
      expect(category.id).toBe(categoryId);
      expect(typeof category.name).toBe("string");
    });

    it("returns NOT_FOUND for unknown category ID", async () => {
      const app = buildTestApp();
      await app.ready();

      const unknownId = "00000000-0000-4000-8000-999999999999";
      const response = await app.inject({
        method: "GET",
        url: `/categories/${unknownId}`,
      });

      expect(response.statusCode).toBe(404);
      const body = response.json() as ApiErrorResponse;
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("response shape conformance", () => {
    it("task responses contain only public shape, no Prisma relation objects", async () => {
      const app = buildTestApp();
      await app.ready();

      const listResponse = await app.inject({
        method: "GET",
        url: "/tasks",
      });
      const tasks = listResponse.json() as Task[];
      if (tasks.length === 0) return;

      // Check for absence of Prisma relation fields
      const task = tasks[0];
      expect(task).not.toHaveProperty("assignee");
      expect(task).not.toHaveProperty("parent");
      expect(task).not.toHaveProperty("subtasks");
      expect(task).not.toHaveProperty("requiredSkills");
    });

    it("developer responses contain only public shape, no Prisma relation objects", async () => {
      const app = buildTestApp();
      await app.ready();

      const listResponse = await app.inject({
        method: "GET",
        url: "/developers",
      });
      const developers = listResponse.json() as Developer[];
      if (developers.length === 0) return;

      // Check for absence of Prisma relation fields
      const developer = developers[0];
      expect(developer).not.toHaveProperty("skills");
      expect(developer).not.toHaveProperty("assignedTasks");
    });
  });
});
