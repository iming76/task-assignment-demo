import type { PatchTaskInput, Task } from "@repo/shared-types";
import type { TransactionClient } from "../transaction.js";
import type { PrismaClient } from "../../generated/prisma/client.js";

export interface CreateTaskRecord {
  title: string;
  description: string;
  requiredSkillIds: string[];
  parentTaskId: string | null;
  depth: number;
}

/**
 * Persistence boundary for tasks. Implementations own Prisma access and
 * return the flattened public `Task` shape; callers never see relation
 * objects or join tables.
 */
export interface TaskRepository {
  list(): Promise<Task[]>;
  findById(id: string, tx?: TransactionClient): Promise<Task | null>;
  hasChildren(id: string, tx?: TransactionClient): Promise<boolean>;
  create(input: CreateTaskRecord, tx?: TransactionClient): Promise<Task>;
  update(
    id: string,
    input: PatchTaskInput,
    tx?: TransactionClient,
  ): Promise<Task>;
  delete(id: string, tx?: TransactionClient): Promise<void>;
}

/**
 * Flattens Prisma task and task_skills join table into the public Task shape
 * with requiredSkillIds as a flat string array.
 */
async function flattenTask(taskRecord: {
  id: string;
  title: string;
  description: string;
  status: string;
  depth: number;
  assigneeId: string | null;
  parentTaskId: string | null;
  requiredSkills: Array<{ skillId: string }>;
}): Promise<Task> {
  return {
    id: taskRecord.id,
    title: taskRecord.title,
    description: taskRecord.description,
    status: taskRecord.status as "TODO" | "DONE",
    depth: taskRecord.depth,
    assigneeId: taskRecord.assigneeId,
    parentTaskId: taskRecord.parentTaskId,
    requiredSkillIds: taskRecord.requiredSkills.map((rs) => rs.skillId).sort(),
  };
}

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly client: PrismaClient) {}

  async list(): Promise<Task[]> {
    const tasks = await this.client.task.findMany({
      include: { requiredSkills: { select: { skillId: true } } },
      orderBy: { id: "asc" },
    });
    return Promise.all(tasks.map((t) => flattenTask(t as any)));
  }

  async findById(id: string, tx?: TransactionClient): Promise<Task | null> {
    const client = tx ?? this.client;
    const task = await client.task.findUnique({
      where: { id },
      include: { requiredSkills: { select: { skillId: true } } },
    });
    if (!task) return null;
    return flattenTask(task as any);
  }

  async hasChildren(id: string, tx?: TransactionClient): Promise<boolean> {
    const client = tx ?? this.client;
    const child = await client.task.findFirst({
      where: { parentTaskId: id },
      select: { id: true },
    });
    return child !== null;
  }

  async create(input: CreateTaskRecord, tx?: TransactionClient): Promise<Task> {
    const client = tx ?? this.client;
    const task = await client.task.create({
      data: {
        title: input.title,
        description: input.description,
        depth: input.depth,
        parentTaskId: input.parentTaskId,
        requiredSkills: {
          create: input.requiredSkillIds.map((skillId) => ({ skillId })),
        },
      },
      include: { requiredSkills: { select: { skillId: true } } },
    });
    return flattenTask(task as any);
  }

  async update(
    id: string,
    input: PatchTaskInput,
    tx?: TransactionClient,
  ): Promise<Task> {
    const client = tx ?? this.client;
    const task = await client.task.update({
      where: { id },
      data: {
        title: input.title,
        description: input.description,
        status: input.status,
        assigneeId: input.assigneeId,
        requiredSkills:
          input.requiredSkillIds !== undefined
            ? {
                deleteMany: {},
                create: input.requiredSkillIds.map((skillId) => ({ skillId })),
              }
            : undefined,
      },
      include: { requiredSkills: { select: { skillId: true } } },
    });
    return flattenTask(task as any);
  }

  async delete(id: string, tx?: TransactionClient): Promise<void> {
    const client = tx ?? this.client;
    await client.task.delete({ where: { id } });
  }
}
