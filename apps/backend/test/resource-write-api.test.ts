import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import type { ApiErrorResponse, Developer, Skill } from "@repo/shared-types";
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

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "task_skills", "developer_skills", "tasks", "skills", "categories", "developers" RESTART IDENTITY CASCADE`,
  );
}

function buildTestApp() {
  return buildApp(
    {
      healthService: createHealthService(new FakeHealthRepository()),
      taskService: createTaskService(new PrismaTaskRepository(prisma)),
      developerService: createDeveloperService(
        new PrismaDeveloperRepository(prisma),
      ),
      skillService: createSkillService(new PrismaSkillRepository(prisma)),
      categoryService: createCategoryService(
        new PrismaCategoryRepository(prisma),
      ),
    },
    { logger: false },
  );
}

const unknownId = "00000000-0000-4000-8000-999999999999";

async function createCategory(name: string) {
  return prisma.category.create({ data: { name } });
}

async function createSkillRow(categoryId: string, name: string) {
  return prisma.skill.create({
    data: { name, description: `${name} description`, categoryId },
  });
}

describe("resource write api", () => {
  beforeAll(async () => {
    await resetDatabase();
  });

  afterEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await resetDatabase();
  });

  describe("POST /developers", () => {
    it("creates a developer with no skills", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/developers",
        payload: { name: "Alice" },
      });

      expect(response.statusCode).toBe(201);
      const developer = response.json() as Developer;
      expect(developer.name).toBe("Alice");
      expect(developer.skillIds).toEqual([]);
    });

    it("creates a developer with valid skillIds", async () => {
      const category = await createCategory("Frontend");
      const skill = await createSkillRow(category.id, "React");

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/developers",
        payload: { name: "Bob", skillIds: [skill.id] },
      });

      expect(response.statusCode).toBe(201);
      const developer = response.json() as Developer;
      expect(developer.skillIds).toEqual([skill.id]);
    });

    it("returns NOT_FOUND when a skillId does not exist", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/developers",
        payload: { name: "Carol", skillIds: [unknownId] },
      });

      expect(response.statusCode).toBe(404);
      const body = response.json() as ApiErrorResponse;
      expect(body.error.code).toBe("NOT_FOUND");

      const count = await prisma.developer.count({
        where: { name: "Carol" },
      });
      expect(count).toBe(0);
    });

    it("returns VALIDATION_ERROR for a duplicate developer name", async () => {
      await prisma.developer.create({ data: { name: "Zoe" } });

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/developers",
        payload: { name: "Zoe" },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json() as ApiErrorResponse;
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns VALIDATION_ERROR for an empty name", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/developers",
        payload: { name: "" },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json() as ApiErrorResponse;
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("PATCH /developers/:id", () => {
    it("updates a developer's name", async () => {
      const developer = await prisma.developer.create({
        data: { name: "Dana" },
      });

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "PATCH",
        url: `/developers/${developer.id}`,
        payload: { name: "Dana Updated" },
      });

      expect(response.statusCode).toBe(200);
      expect((response.json() as Developer).name).toBe("Dana Updated");
    });

    it("replaces a developer's skillIds", async () => {
      const category = await createCategory("Backend");
      const skillA = await createSkillRow(category.id, "Node.js");
      const skillB = await createSkillRow(category.id, "PostgreSQL");
      const developer = await prisma.developer.create({
        data: {
          name: "Eve",
          skills: { create: [{ skillId: skillA.id }] },
        },
      });

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "PATCH",
        url: `/developers/${developer.id}`,
        payload: { skillIds: [skillB.id] },
      });

      expect(response.statusCode).toBe(200);
      expect((response.json() as Developer).skillIds).toEqual([skillB.id]);
    });

    it("returns NOT_FOUND for an unknown developer id", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "PATCH",
        url: `/developers/${unknownId}`,
        payload: { name: "Nobody" },
      });

      expect(response.statusCode).toBe(404);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "NOT_FOUND",
      );
    });

    it("returns NOT_FOUND when patched skillIds reference an unknown skill", async () => {
      const developer = await prisma.developer.create({
        data: { name: "Frank" },
      });

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "PATCH",
        url: `/developers/${developer.id}`,
        payload: { skillIds: [unknownId] },
      });

      expect(response.statusCode).toBe(404);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "NOT_FOUND",
      );
    });
  });

  describe("DELETE /developers/:id", () => {
    it("deletes an unassigned developer", async () => {
      const developer = await prisma.developer.create({
        data: { name: "Grace" },
      });

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "DELETE",
        url: `/developers/${developer.id}`,
      });

      expect(response.statusCode).toBe(204);
      const remaining = await prisma.developer.findUnique({
        where: { id: developer.id },
      });
      expect(remaining).toBeNull();
    });

    it("returns NOT_FOUND for an unknown developer id", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "DELETE",
        url: `/developers/${unknownId}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it("returns IN_USE when the developer is still assigned to a task", async () => {
      const developer = await prisma.developer.create({
        data: { name: "Heidi" },
      });
      await prisma.task.create({
        data: {
          title: "Ship it",
          description: "Ship the feature",
          assigneeId: developer.id,
        },
      });

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "DELETE",
        url: `/developers/${developer.id}`,
      });

      expect(response.statusCode).toBe(409);
      expect((response.json() as ApiErrorResponse).error.code).toBe("IN_USE");

      const stillThere = await prisma.developer.findUnique({
        where: { id: developer.id },
      });
      expect(stillThere).not.toBeNull();
    });
  });

  describe("POST /skills", () => {
    it("creates a skill", async () => {
      const category = await createCategory("Frontend");

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/skills",
        payload: {
          name: "Vue",
          description: "Frontend framework",
          categoryId: category.id,
        },
      });

      expect(response.statusCode).toBe(201);
      const skill = response.json() as Skill;
      expect(skill.name).toBe("Vue");
      expect(skill.categoryId).toBe(category.id);
    });

    it("returns NOT_FOUND when categoryId does not exist", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/skills",
        payload: {
          name: "Vue",
          description: "Frontend framework",
          categoryId: unknownId,
        },
      });

      expect(response.statusCode).toBe(404);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "NOT_FOUND",
      );
    });

    it("returns VALIDATION_ERROR for a duplicate name within the same category", async () => {
      const category = await createCategory("Frontend");
      await createSkillRow(category.id, "Vue");

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "POST",
        url: "/skills",
        payload: {
          name: "Vue",
          description: "Frontend framework",
          categoryId: category.id,
        },
      });

      expect(response.statusCode).toBe(400);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "VALIDATION_ERROR",
      );
    });
  });

  describe("PATCH /skills/:id", () => {
    it("updates a skill's description", async () => {
      const category = await createCategory("Frontend");
      const skill = await createSkillRow(category.id, "Svelte");

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "PATCH",
        url: `/skills/${skill.id}`,
        payload: { description: "Updated description" },
      });

      expect(response.statusCode).toBe(200);
      expect((response.json() as Skill).description).toBe(
        "Updated description",
      );
    });

    it("returns NOT_FOUND when the target category does not exist", async () => {
      const category = await createCategory("Frontend");
      const skill = await createSkillRow(category.id, "Svelte");

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "PATCH",
        url: `/skills/${skill.id}`,
        payload: { categoryId: unknownId },
      });

      expect(response.statusCode).toBe(404);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "NOT_FOUND",
      );
    });

    it("returns VALIDATION_ERROR when renaming to a name already used in the category", async () => {
      const category = await createCategory("Frontend");
      await createSkillRow(category.id, "Vue");
      const skill = await createSkillRow(category.id, "Svelte");

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "PATCH",
        url: `/skills/${skill.id}`,
        payload: { name: "Vue" },
      });

      expect(response.statusCode).toBe(400);
      expect((response.json() as ApiErrorResponse).error.code).toBe(
        "VALIDATION_ERROR",
      );
    });

    it("allows a skill to keep its own name unchanged", async () => {
      const category = await createCategory("Frontend");
      const skill = await createSkillRow(category.id, "Svelte");

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "PATCH",
        url: `/skills/${skill.id}`,
        payload: { name: "Svelte", description: "Still svelte" },
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe("DELETE /skills/:id", () => {
    it("deletes an unreferenced skill", async () => {
      const category = await createCategory("Frontend");
      const skill = await createSkillRow(category.id, "Svelte");

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "DELETE",
        url: `/skills/${skill.id}`,
      });

      expect(response.statusCode).toBe(204);
    });

    it("returns NOT_FOUND for an unknown skill id", async () => {
      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "DELETE",
        url: `/skills/${unknownId}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it("returns IN_USE when the skill is held by a developer", async () => {
      const category = await createCategory("Frontend");
      const skill = await createSkillRow(category.id, "Svelte");
      await prisma.developer.create({
        data: {
          name: "Ivan",
          skills: { create: [{ skillId: skill.id }] },
        },
      });

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "DELETE",
        url: `/skills/${skill.id}`,
      });

      expect(response.statusCode).toBe(409);
      expect((response.json() as ApiErrorResponse).error.code).toBe("IN_USE");
    });

    it("returns IN_USE when the skill is required by a task", async () => {
      const category = await createCategory("Frontend");
      const skill = await createSkillRow(category.id, "Svelte");
      await prisma.task.create({
        data: {
          title: "Build UI",
          description: "Build the UI",
          requiredSkills: { create: [{ skillId: skill.id }] },
        },
      });

      const app = buildTestApp();
      await app.ready();

      const response = await app.inject({
        method: "DELETE",
        url: `/skills/${skill.id}`,
      });

      expect(response.statusCode).toBe(409);
      expect((response.json() as ApiErrorResponse).error.code).toBe("IN_USE");
    });
  });
});
