import type { CreateTaskInput, PatchTaskInput, Task } from "@repo/shared-types";
import { NotFoundError } from "../errors/application-error.js";
import type { TaskRepository } from "../lib/repositories/task-repository.js";

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

export class DefaultTaskService implements TaskService {
  constructor(private readonly repository: TaskRepository) {}

  async list(): Promise<Task[]> {
    return this.repository.list();
  }

  async get(id: string): Promise<Task> {
    const task = await this.repository.findById(id);
    if (!task) throw new NotFoundError(`Task with id ${id} not found`);
    return task;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    return this.repository.create({
      title: input.title,
      description: input.description,
      requiredSkillIds: input.requiredSkillIds ?? [],
      parentTaskId: input.parentTaskId ?? null,
      depth: input.parentTaskId ? 2 : 1, // TODO: compute depth properly
    });
  }

  async update(id: string, input: PatchTaskInput): Promise<Task> {
    await this.get(id); // Ensure task exists
    return this.repository.update(id, input);
  }

  async remove(id: string): Promise<void> {
    await this.get(id); // Ensure task exists
    await this.repository.delete(id);
  }
}
