import {
  MAX_TASK_DEPTH,
  type CreateTaskInput,
  type PatchTaskInput,
  type Task,
} from "@repo/shared-types";
import {
  CompletedAncestorError,
  InUseError,
  NotFoundError,
  SkillMismatchError,
  SubtasksIncompleteError,
  ValidationError,
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

export function createTaskService(
  repository: TaskRepository,
  developerRepository: DeveloperRepository,
  skillRepository: SkillRepository,
  transactionRunner: TransactionRunner,
  skillInferenceService: SkillInferenceService = new DefaultSkillInferenceService(
    new NotConfiguredSkillInferenceProvider(),
    skillRepository,
  ),
): TaskService {
  const list = (): Promise<Task[]> => repository.list();

  const get = async (id: string): Promise<Task> => {
    const task = await repository.findById(id);
    if (!task) throw new NotFoundError(`Task with id ${id} not found`);
    return task;
  };

  const create = async (input: CreateTaskInput): Promise<Task> => {
    // Runs before the transaction: a future real provider will make a
    // network call, which should not hold a DB transaction open.
    const requiredSkillIds =
      input.requiredSkillIds ??
      (await skillInferenceService.inferSkillIds({
        title: input.title,
        description: input.description,
      }));

    return transactionRunner.run(async (tx) => {
      let depth = 1;
      if (input.parentTaskId) {
        const parent = await repository.findById(input.parentTaskId, tx);
        if (!parent) {
          throw new NotFoundError(
            `Parent task with id ${input.parentTaskId} not found`,
          );
        }
        depth = parent.depth + 1;
        if (depth > MAX_TASK_DEPTH) {
          throw new ValidationError(
            `Tasks cannot be nested deeper than ${MAX_TASK_DEPTH} levels`,
          );
        }

        const ancestorIds = await repository.findAncestorIds(
          input.parentTaskId,
          tx,
        );
        await assertNoneDone(
          [input.parentTaskId, ...ancestorIds],
          tx,
          (doneId) =>
            `Task ${doneId} is already DONE; cannot create a task beneath it`,
        );
      }

      await assertSkillsExist(requiredSkillIds, tx);

      return repository.create(
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
  };

  const update = async (id: string, input: PatchTaskInput): Promise<Task> => {
    return transactionRunner.run(async (tx) => {
      const existing = await repository.findById(id, tx);
      if (!existing) throw new NotFoundError(`Task with id ${id} not found`);

      if (input.status !== undefined && input.status !== existing.status) {
        if (input.status === "DONE") {
          const descendantIds = await repository.findDescendantIds(id, tx);
          const statuses = await repository.lockAndGetStatuses(
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
          const ancestorIds = await repository.findAncestorIds(id, tx);
          await assertNoneDone(
            ancestorIds,
            tx,
            (doneId) =>
              `Task ${doneId} is already DONE; cannot reopen a task beneath it`,
          );
        }
      }

      if (input.requiredSkillIds !== undefined) {
        await assertSkillsExist(input.requiredSkillIds, tx);
      }

      const effectiveAssigneeId =
        input.assigneeId !== undefined ? input.assigneeId : existing.assigneeId;
      const effectiveSkillIds =
        input.requiredSkillIds ?? existing.requiredSkillIds;

      if (effectiveAssigneeId !== null) {
        const developer = await developerRepository.findById(
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

      return repository.update(id, input, tx);
    });
  };

  const remove = async (id: string): Promise<void> => {
    return transactionRunner.run(async (tx) => {
      const existing = await repository.findById(id, tx);
      if (!existing) throw new NotFoundError(`Task with id ${id} not found`);

      const hasChildren = await repository.hasChildren(id, tx);
      if (hasChildren) {
        throw new InUseError(`Task ${id} still has one or more subtasks`);
      }

      await repository.delete(id, tx);
    });
  };

  const assertSkillsExist = async (
    skillIds: string[],
    tx: TransactionClient,
  ): Promise<void> => {
    const skills = await Promise.all(
      skillIds.map((skillId) => skillRepository.findById(skillId, tx)),
    );
    const missingIndex = skills.findIndex((skill) => skill === null);
    if (missingIndex !== -1) {
      throw new NotFoundError(
        `Skill with id ${skillIds[missingIndex]} not found`,
      );
    }
  };

  /**
   * Row-locks every id (deterministic order, scoped to the affected
   * ancestry) and throws if any of them is DONE. Locking here, rather than
   * reading status separately, is what makes this race-safe against a
   * concurrent write to the same tree.
   */
  const assertNoneDone = async (
    ids: string[],
    tx: TransactionClient,
    makeMessage: (doneId: string) => string,
  ): Promise<void> => {
    if (ids.length === 0) return;
    const statuses = await repository.lockAndGetStatuses(ids, tx);
    const doneId = ids.find((taskId) => statuses.get(taskId) === "DONE");
    if (doneId) throw new CompletedAncestorError(makeMessage(doneId));
  };

  return { list, get, create, update, remove };
}
