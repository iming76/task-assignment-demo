import type {
  AgentTaskApplyRequest,
  AgentTaskApplyResponse,
  AgentTaskDraft,
  AgentTaskProposalRequest,
  AgentTaskProposalResponse,
  Task,
} from "@repo/shared-types";
import {
  AgentUnavailableError,
  NotFoundError,
  SkillMismatchError,
} from "../errors/application-error.js";
import type { DeveloperRepository } from "../lib/repositories/developer-repository.js";
import type { SkillRepository } from "../lib/repositories/skill-repository.js";
import type { TaskRepository } from "../lib/repositories/task-repository.js";
import {
  resolveDraftTree,
  type DraftResolutionPolicy,
} from "../lib/task-planning/draft-resolution.js";
import {
  DEFAULT_DRAFT_LIMITS,
  DraftShapeError,
  validateDraftShape,
  type DraftLimits,
  type ShapedDraftNode,
} from "../lib/task-planning/draft-shape.js";
import {
  TaskPlanningProviderError,
  type TaskPlanningProvider,
} from "../lib/task-planning/task-planning-provider.js";
import type {
  TransactionClient,
  TransactionRunner,
} from "../lib/transaction.js";

/**
 * `propose` calls the configured agent and returns an editable, unpersisted
 * draft. `apply` treats a reviewed draft as untrusted input: it re-resolves
 * every ID and rechecks assignment/hierarchy rules before writing the whole
 * tree in one transaction.
 */
export interface AgentTaskService {
  propose(input: AgentTaskProposalRequest): Promise<AgentTaskProposalResponse>;
  apply(input: AgentTaskApplyRequest): Promise<AgentTaskApplyResponse>;
}

const generationPolicy: DraftResolutionPolicy = {
  onUnknownSkill(skillId: string): never {
    throw new DraftShapeError(
      `Unknown skill id in generated draft: ${skillId}`,
    );
  },
  onIneligibleAssignee(): string | null {
    return null;
  },
};

const applyPolicy: DraftResolutionPolicy = {
  onUnknownSkill(skillId: string): never {
    throw new NotFoundError(`Skill with id ${skillId} not found`);
  },
  onIneligibleAssignee(assigneeId, developer): string | null {
    if (!developer) {
      throw new NotFoundError(`Developer with id ${assigneeId} not found`);
    }
    throw new SkillMismatchError(
      `Developer ${assigneeId} does not cover every required skill`,
    );
  },
};

export class DefaultAgentTaskService implements AgentTaskService {
  constructor(
    private readonly provider: TaskPlanningProvider,
    private readonly skillRepository: SkillRepository,
    private readonly developerRepository: DeveloperRepository,
    private readonly taskRepository: TaskRepository,
    private readonly transactionRunner: TransactionRunner,
    private readonly limits: DraftLimits = DEFAULT_DRAFT_LIMITS,
  ) {}

  async propose(
    input: AgentTaskProposalRequest,
  ): Promise<AgentTaskProposalResponse> {
    const [skills, developers] = await Promise.all([
      this.skillRepository.list(),
      this.developerRepository.list(),
    ]);

    let raw: unknown;
    try {
      raw = await this.provider.generate({
        description: input.description,
        skills,
        developers,
      });
    } catch (error) {
      if (error instanceof TaskPlanningProviderError) {
        throw new AgentUnavailableError(
          "Agent planning is not available right now.",
        );
      }
      throw error;
    }

    let shaped: ShapedDraftNode[];
    try {
      shaped = validateDraftShape(raw, this.limits);
    } catch (error) {
      if (error instanceof DraftShapeError) {
        throw new AgentUnavailableError(
          "Agent planning returned an invalid draft.",
        );
      }
      throw error;
    }

    const skillsById = indexById(skills);
    const developersById = indexById(developers);

    let tasks: AgentTaskDraft[];
    try {
      tasks = resolveDraftTree(
        shaped,
        skillsById,
        developersById,
        generationPolicy,
      );
    } catch (error) {
      if (error instanceof DraftShapeError) {
        throw new AgentUnavailableError(
          "Agent planning returned an invalid draft.",
        );
      }
      throw error;
    }

    return { tasks };
  }

  async apply(input: AgentTaskApplyRequest): Promise<AgentTaskApplyResponse> {
    const shaped = validateDraftShape(input.tasks, this.limits);

    return this.transactionRunner.run(async (tx) => {
      const [skills, developers] = await Promise.all([
        this.skillRepository.list(),
        this.developerRepository.list(),
      ]);
      const skillsById = indexById(skills);
      const developersById = indexById(developers);

      const resolved = resolveDraftTree(
        shaped,
        skillsById,
        developersById,
        applyPolicy,
      );

      const created: Task[] = [];
      await this.createTree(resolved, null, 1, tx, created);
      return created;
    });
  }

  private async createTree(
    nodes: AgentTaskDraft[],
    parentTaskId: string | null,
    depth: number,
    tx: TransactionClient,
    created: Task[],
  ): Promise<void> {
    for (const node of nodes) {
      const task = await this.taskRepository.create(
        {
          title: node.name,
          description: node.description,
          requiredSkillIds: node.requiredSkillIds,
          parentTaskId,
          depth,
          assigneeId: node.assigneeId ?? null,
        },
        tx,
      );
      created.push(task);
      await this.createTree(node.subtasks, task.id, depth + 1, tx, created);
    }
  }
}

function indexById<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}
