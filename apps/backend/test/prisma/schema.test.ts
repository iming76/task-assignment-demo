import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/lib/prisma.js";

async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE "task_skills", "developer_skills", "tasks", "skills", "categories", "developers" RESTART IDENTITY CASCADE`,
  );
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await resetDatabase();
  await prisma.$disconnect();
});

describe("uniqueness and required fields", () => {
  it("rejects a duplicate developer name", async () => {
    await prisma.developer.create({ data: { name: "Ada Lovelace" } });

    await expect(
      prisma.developer.create({ data: { name: "Ada Lovelace" } }),
    ).rejects.toThrow();
  });

  it("rejects a duplicate category name", async () => {
    await prisma.category.create({ data: { name: "Frontend" } });

    await expect(
      prisma.category.create({ data: { name: "Frontend" } }),
    ).rejects.toThrow();
  });

  it("rejects a skill name reused in a different category", async () => {
    const frontend = await prisma.category.create({
      data: { name: "Frontend" },
    });
    const backend = await prisma.category.create({ data: { name: "Backend" } });
    await prisma.skill.create({
      data: {
        name: "TypeScript",
        description: "Typed superset of JavaScript.",
        categoryId: frontend.id,
      },
    });

    await expect(
      prisma.skill.create({
        data: {
          name: "TypeScript",
          description: "Typed superset of JavaScript.",
          categoryId: backend.id,
        },
      }),
    ).rejects.toThrow();
  });

  it("requires a skill description at the database level", async () => {
    const category = await prisma.category.create({
      data: { name: "Frontend" },
    });

    await expect(
      prisma.$executeRawUnsafe(
        `INSERT INTO "skills" (id, name, description, category_id) VALUES ($1, $2, NULL, $3)`,
        randomUUID(),
        "React",
        category.id,
      ),
    ).rejects.toThrow();
  });
});

describe("join table uniqueness", () => {
  it("rejects a duplicate developer/skill pairing", async () => {
    const developer = await prisma.developer.create({
      data: { name: "Ada Lovelace" },
    });
    const category = await prisma.category.create({
      data: { name: "Frontend" },
    });
    const skill = await prisma.skill.create({
      data: {
        name: "React",
        description: "UI library.",
        categoryId: category.id,
      },
    });
    await prisma.developerSkill.create({
      data: { developerId: developer.id, skillId: skill.id },
    });

    await expect(
      prisma.developerSkill.create({
        data: { developerId: developer.id, skillId: skill.id },
      }),
    ).rejects.toThrow();
  });

  it("rejects a duplicate task/skill pairing", async () => {
    const category = await prisma.category.create({
      data: { name: "Frontend" },
    });
    const skill = await prisma.skill.create({
      data: {
        name: "React",
        description: "UI library.",
        categoryId: category.id,
      },
    });
    const task = await prisma.task.create({
      data: { title: "Build UI", description: "..." },
    });
    await prisma.taskSkill.create({
      data: { taskId: task.id, skillId: skill.id },
    });

    await expect(
      prisma.taskSkill.create({ data: { taskId: task.id, skillId: skill.id } }),
    ).rejects.toThrow();
  });
});

describe("restricted deletes", () => {
  it("blocks deleting a category while a skill references it", async () => {
    const category = await prisma.category.create({
      data: { name: "Frontend" },
    });
    await prisma.skill.create({
      data: {
        name: "React",
        description: "UI library.",
        categoryId: category.id,
      },
    });

    await expect(
      prisma.category.delete({ where: { id: category.id } }),
    ).rejects.toThrow();
  });

  it("blocks deleting a developer while assigned to a task", async () => {
    const developer = await prisma.developer.create({
      data: { name: "Ada Lovelace" },
    });
    await prisma.task.create({
      data: { title: "Build UI", description: "...", assigneeId: developer.id },
    });

    await expect(
      prisma.developer.delete({ where: { id: developer.id } }),
    ).rejects.toThrow();
  });

  it("blocks deleting a task that still has subtasks", async () => {
    const parent = await prisma.task.create({
      data: { title: "Parent", description: "..." },
    });
    await prisma.task.create({
      data: { title: "Child", description: "...", parentTaskId: parent.id },
    });

    await expect(
      prisma.task.delete({ where: { id: parent.id } }),
    ).rejects.toThrow();
  });

  it("blocks deleting a skill required by a task", async () => {
    const category = await prisma.category.create({
      data: { name: "Frontend" },
    });
    const skill = await prisma.skill.create({
      data: {
        name: "React",
        description: "UI library.",
        categoryId: category.id,
      },
    });
    const task = await prisma.task.create({
      data: { title: "Build UI", description: "..." },
    });
    await prisma.taskSkill.create({
      data: { taskId: task.id, skillId: skill.id },
    });

    await expect(
      prisma.skill.delete({ where: { id: skill.id } }),
    ).rejects.toThrow();
  });

  it("blocks deleting a skill held by a developer", async () => {
    const developer = await prisma.developer.create({
      data: { name: "Ada Lovelace" },
    });
    const category = await prisma.category.create({
      data: { name: "Frontend" },
    });
    const skill = await prisma.skill.create({
      data: {
        name: "React",
        description: "UI library.",
        categoryId: category.id,
      },
    });
    await prisma.developerSkill.create({
      data: { developerId: developer.id, skillId: skill.id },
    });

    await expect(
      prisma.skill.delete({ where: { id: skill.id } }),
    ).rejects.toThrow();
  });
});

describe("task hierarchy", () => {
  it("persists a root, child, and grandchild with correct parent references", async () => {
    const root = await prisma.task.create({
      data: { title: "Root", description: "..." },
    });
    const child = await prisma.task.create({
      data: {
        title: "Child",
        description: "...",
        parentTaskId: root.id,
        depth: root.depth + 1,
      },
    });
    const grandchild = await prisma.task.create({
      data: {
        title: "Grandchild",
        description: "...",
        parentTaskId: child.id,
        depth: child.depth + 1,
      },
    });

    const [persistedRoot, persistedChild, persistedGrandchild] =
      await Promise.all([
        prisma.task.findUniqueOrThrow({ where: { id: root.id } }),
        prisma.task.findUniqueOrThrow({ where: { id: child.id } }),
        prisma.task.findUniqueOrThrow({ where: { id: grandchild.id } }),
      ]);

    expect(persistedRoot.parentTaskId).toBeNull();
    expect(persistedRoot.depth).toBe(1);
    expect(persistedChild.parentTaskId).toBe(root.id);
    expect(persistedChild.depth).toBe(2);
    expect(persistedGrandchild.parentTaskId).toBe(child.id);
    expect(persistedGrandchild.depth).toBe(3);
  });
});
