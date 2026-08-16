import type { PatchTaskInput, Task } from "@repo/shared-types";
import type { TransactionClient } from "../transaction.js";

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
  findById(id: string): Promise<Task | null>;
  create(input: CreateTaskRecord, tx?: TransactionClient): Promise<Task>;
  update(
    id: string,
    input: PatchTaskInput,
    tx?: TransactionClient,
  ): Promise<Task>;
  delete(id: string): Promise<void>;
}
