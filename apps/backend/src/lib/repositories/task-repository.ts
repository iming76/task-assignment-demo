import type { PatchTaskInput, Task, TaskStatus } from "@repo/shared-types";
import type { TransactionClient } from "../transaction.js";
import type { PrismaClient } from "../../generated/prisma/client.js";

export interface CreateTaskRecord {
  title: string;
  description: string;
  requiredSkillIds: string[];
  parentTaskId: string | null;
  depth: number;
  /** Omitted by regular creation; set by agent orchestration inside its transaction. */
  assigneeId?: string | null;
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
  countActiveAssignmentsByDeveloper(
    tx: TransactionClient,
  ): Promise<Map<string, number>>;
  /** All ancestor ids from immediate parent to root, cycle-safe, unlocked. */
  findAncestorIds(id: string, tx: TransactionClient): Promise<string[]>;
  /** All descendant ids at any depth, cycle-safe, unlocked. */
  findDescendantIds(id: string, tx: TransactionClient): Promise<string[]>;
  /**
   * Row-locks the given tasks (`SELECT ... FOR UPDATE`, deterministic id
   * order to avoid deadlocks) and returns their current status, atomically
   * within the caller's transaction. Callers use this to make invariant
   * checks race-safe against concurrent writes to the same tree.
   */
  lockAndGetStatuses(
    ids: string[],
    tx: TransactionClient,
  ): Promise<Map<string, TaskStatus>>;
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
  createdAt: Date;
  updatedAt: Date;
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
    createdAt: taskRecord.createdAt.toISOString(),
    updatedAt: taskRecord.updatedAt.toISOString(),
  };
}

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly client: PrismaClient) {}

  async list(): Promise<Task[]> {
    const tasks = await this.client.task.findMany({
      include: { requiredSkills: { select: { skillId: true } } },
      orderBy: { id: "asc" },
    });
    return Promise.all(tasks.map((task) => flattenTask(task)));
  }

  async findById(id: string, tx?: TransactionClient): Promise<Task | null> {
    const client = tx ?? this.client;
    const task = await client.task.findUnique({
      where: { id },
      include: { requiredSkills: { select: { skillId: true } } },
    });
    if (!task) return null;
    return flattenTask(task);
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
        assigneeId: input.assigneeId ?? null,
        requiredSkills: {
          create: input.requiredSkillIds.map((skillId) => ({ skillId })),
        },
      },
      include: { requiredSkills: { select: { skillId: true } } },
    });
    return flattenTask(task);
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
    return flattenTask(task);
  }

  async delete(id: string, tx?: TransactionClient): Promise<void> {
    const client = tx ?? this.client;
    await client.task.delete({ where: { id } });
  }

  async countActiveAssignmentsByDeveloper(
    tx: TransactionClient,
  ): Promise<Map<string, number>> {
    const groups = await tx.task.groupBy({
      by: ["assigneeId"],
      where: { assigneeId: { not: null }, status: { not: "DONE" } },
      _count: { _all: true },
    });
    return new Map(
      groups.flatMap((group) =>
        group.assigneeId === null
          ? []
          : [[group.assigneeId, group._count._all] as const],
      ),
    );
  }

  async findAncestorIds(id: string, tx: TransactionClient): Promise<string[]> {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      WITH RECURSIVE ancestors AS (
        SELECT id, parent_task_id, ARRAY[id] AS path
        FROM tasks
        WHERE id = ${id}
        UNION ALL
        SELECT t.id, t.parent_task_id, a.path || t.id
        FROM tasks t
        INNER JOIN ancestors a ON t.id = a.parent_task_id
        WHERE NOT t.id = ANY(a.path)
      )
      SELECT id FROM ancestors WHERE id != ${id}
    `;
    return rows.map((row) => row.id);
  }

  async findDescendantIds(
    id: string,
    tx: TransactionClient,
  ): Promise<string[]> {
    const rows = await tx.$queryRaw<Array<{ id: string }>>`
      WITH RECURSIVE descendants AS (
        SELECT id, parent_task_id, ARRAY[id] AS path
        FROM tasks
        WHERE id = ${id}
        UNION ALL
        SELECT t.id, t.parent_task_id, d.path || t.id
        FROM tasks t
        INNER JOIN descendants d ON t.parent_task_id = d.id
        WHERE NOT t.id = ANY(d.path)
      )
      SELECT id FROM descendants WHERE id != ${id}
    `;
    return rows.map((row) => row.id);
  }

  async lockAndGetStatuses(
    ids: string[],
    tx: TransactionClient,
  ): Promise<Map<string, TaskStatus>> {
    if (ids.length === 0) return new Map();
    const rows = await tx.$queryRaw<Array<{ id: string; status: TaskStatus }>>`
      SELECT id, status FROM tasks
      WHERE id = ANY(${ids}::text[])
      ORDER BY id
      FOR UPDATE
    `;
    return new Map(rows.map((row) => [row.id, row.status]));
  }
}
