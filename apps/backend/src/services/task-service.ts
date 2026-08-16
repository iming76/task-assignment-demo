import type { CreateTaskInput, PatchTaskInput, Task } from "@repo/shared-types";
import {
  InUseError,
  NotFoundError,
  SkillMismatchError,
} from "../errors/application-error.js";
import type { DeveloperRepository } from "../lib/repositories/developer-repository.js";
import type { SkillRepository } from "../lib/repositories/skill-repository.js";
import type { TaskRepository } from "../lib/repositories/task-repository.js";
import {
  NoopSkillInferenceProvider,
  type SkillInferenceProvider,
} from "../lib/skill-inference/skill-inference-provider.js";
import type {
  TransactionClient,
  TransactionRunner,
} from "../lib/transaction.js";

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
  constructor(
    private readonly repository: TaskRepository,
    private readonly developerRepository: DeveloperRepository,
    private readonly skillRepository: SkillRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly skillInferenceProvider: SkillInferenceProvider = new NoopSkillInferenceProvider(),
  ) {}

  async list(): Promise<Task[]> {
    return this.repository.list();
  }

  async get(id: string): Promise<Task> {
    const task = await this.repository.findById(id);
    if (!task) throw new NotFoundError(`Task with id ${id} not found`);
    return task;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    // Runs before the transaction: a future real provider will make a
    // network call, which should not hold a DB transaction open.
    const requiredSkillIds =
      input.requiredSkillIds ??
      (await this.skillInferenceProvider.inferSkillIds({
        title: input.title,
        description: input.description,
        availableSkillIds: [],
      }));

    return this.transactionRunner.run(async (tx) => {
      let depth = 1;
      if (input.parentTaskId) {
        const parent = await this.repository.findById(input.parentTaskId, tx);
        if (!parent) {
          throw new NotFoundError(
            `Parent task with id ${input.parentTaskId} not found`,
          );
        }
        depth = parent.depth + 1;
      }

      await this.assertSkillsExist(requiredSkillIds, tx);

      return this.repository.create(
        {
          title: input.title,
          description: input.description,
          requiredSkillIds,
          parentTaskId: input.parentTaskId ?? null,
          depth,
        },
        tx,
      );
    });
  }

  async update(id: string, input: PatchTaskInput): Promise<Task> {
    return this.transactionRunner.run(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) throw new NotFoundError(`Task with id ${id} not found`);

      if (input.requiredSkillIds !== undefined) {
        await this.assertSkillsExist(input.requiredSkillIds, tx);
      }

      const effectiveAssigneeId =
        input.assigneeId !== undefined ? input.assigneeId : existing.assigneeId;
      const effectiveSkillIds =
        input.requiredSkillIds ?? existing.requiredSkillIds;

      if (effectiveAssigneeId !== null) {
        const developer = await this.developerRepository.findById(
          effectiveAssigneeId,
          tx,
        );
        if (!developer) {
          throw new NotFoundError(
            `Developer with id ${effectiveAssigneeId} not found`,
          );
        }
        const missing = effectiveSkillIds.filter(
          (skillId) => !developer.skillIds.includes(skillId),
        );
        if (missing.length > 0) {
          throw new SkillMismatchError(
            `Developer ${effectiveAssigneeId} does not cover required skills: ${missing.join(", ")}`,
          );
        }
      }

      return this.repository.update(id, input, tx);
    });
  }

  async remove(id: string): Promise<void> {
    return this.transactionRunner.run(async (tx) => {
      const existing = await this.repository.findById(id, tx);
      if (!existing) throw new NotFoundError(`Task with id ${id} not found`);

      const hasChildren = await this.repository.hasChildren(id, tx);
      if (hasChildren) {
        throw new InUseError(`Task ${id} still has one or more subtasks`);
      }

      await this.repository.delete(id, tx);
    });
  }

  private async assertSkillsExist(
    skillIds: string[],
    tx: TransactionClient,
  ): Promise<void> {
    const skills = await Promise.all(
      skillIds.map((skillId) => this.skillRepository.findById(skillId, tx)),
    );
    const missingIndex = skills.findIndex((skill) => skill === null);
    if (missingIndex !== -1) {
      throw new NotFoundError(
        `Skill with id ${skillIds[missingIndex]} not found`,
      );
    }
  }
}
