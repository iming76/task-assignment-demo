import type { CreateTaskInput, PatchTaskInput, Task } from "@repo/shared-types";

/**
 * Owns task creation, assignment eligibility, status transitions, and the
 * recursive subtask rules. Independent of Fastify request objects.
 */
export interface TaskService {
  list(): Promise<Task[]>;
  get(id: string): Promise<Task>;
  create(input: CreateTaskInput): Promise<Task>;
  update(id: string, input: PatchTaskInput): Promise<Task>;
  remove(id: string): Promise<void>;
}
