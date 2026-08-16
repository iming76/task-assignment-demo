import type { CreateTaskInput, PatchTaskInput, Task } from "@repo/shared-types";
import {
  CompletedAncestorError,
  InUseError,
  NotFoundError,
  SkillMismatchError,
  SubtasksIncompleteError,
} from "../errors/application-error.js";
import type { DeveloperRepository } from "../lib/repositories/developer-repository.js";
import type { SkillRepository } from "../lib/repositories/skill-repository.js";
import type { TaskRepository } from "../lib/repositories/task-repository.js";
import {
  DefaultSkillInferenceService,
  type SkillInferenceService,
} from "../lib/skill-inference/skill-inference-service.js";
import { NotConfiguredSkillInferenceProvider } from "../lib/skill-inference/skill-inference-provider.js";
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
    private readonly skillInferenceService: SkillInferenceService = new DefaultSkillInferenceService(
      new NotConfiguredSkillInferenceProvider(),
      skillRepository,
    ),
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
      (await this.skillInferenceService.inferSkillIds({
        title: input.title,
        description: input.description,
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

        const ancestorIds = await this.repository.findAncestorIds(
          input.parentTaskId,
          tx,
        );
        await this.assertNoneDone(
          [input.parentTaskId, ...ancestorIds],
          tx,
          (doneId) =>
            `Task ${doneId} is already DONE; cannot create a task beneath it`,
        );
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

      if (input.status !== undefined && input.status !== existing.status) {
        if (input.status === "DONE") {
          const descendantIds = await this.repository.findDescendantIds(id, tx);
          const statuses = await this.repository.lockAndGetStatuses(
            [id, ...descendantIds],
            tx,
          );
          const incompleteId = descendantIds.find(
            (taskId) => statuses.get(taskId) === "TODO",
          );
          if (incompleteId) {
            throw new SubtasksIncompleteError(
              `Task ${incompleteId} is still TODO; cannot complete a task while a descendant is incomplete`,
            );
          }
        } else {
          const ancestorIds = await this.repository.findAncestorIds(id, tx);
          await this.assertNoneDone(
            ancestorIds,
            tx,
            (doneId) =>
              `Task ${doneId} is already DONE; cannot reopen a task beneath it`,
          );
        }
      }

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

  /**
   * Row-locks every id (deterministic order, scoped to the affected
   * ancestry) and throws if any of them is DONE. Locking here, rather than
   * reading status separately, is what makes this race-safe against a
   * concurrent write to the same tree.
   */
  private async assertNoneDone(
    ids: string[],
    tx: TransactionClient,
    makeMessage: (doneId: string) => string,
  ): Promise<void> {
    if (ids.length === 0) return;
    const statuses = await this.repository.lockAndGetStatuses(ids, tx);
    const doneId = ids.find((taskId) => statuses.get(taskId) === "DONE");
    if (doneId) throw new CompletedAncestorError(makeMessage(doneId));
  }
}
