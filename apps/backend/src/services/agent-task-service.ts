import {
  MAX_TASK_DEPTH,
  type AgentTaskCreatedResponse,
  type AgentTaskRequest,
  type AgentTaskResponse,
  type AgentTaskStaffingGap,
  type Developer,
  type Task,
} from "@repo/shared-types";
import {
  AgentUnavailableError,
  ValidationError,
} from "../errors/application-error.js";
import {
  AgentOrchestrationProviderError,
  type AgentOrchestrationProvider,
} from "../lib/agent-orchestration/agent-orchestration-provider.js";
import type { PlannedTaskNode } from "../lib/agent-orchestration/decision-schema.js";
import type { CategoryRepository } from "../lib/repositories/category-repository.js";
import type { DeveloperRepository } from "../lib/repositories/developer-repository.js";
import type { SkillRepository } from "../lib/repositories/skill-repository.js";
import type { TaskRepository } from "../lib/repositories/task-repository.js";
import type {
  TransactionClient,
  TransactionRunner,
} from "../lib/transaction.js";

const MAX_MESSAGES = 20;
const MAX_CONVERSATION_CHARACTERS = 20_000;

export interface AgentTaskService {
  orchestrate(input: AgentTaskRequest): Promise<AgentTaskResponse>;
}

export function createAgentTaskService(
  provider: AgentOrchestrationProvider,
  skillRepository: SkillRepository,
  categoryRepository: CategoryRepository,
  developerRepository: DeveloperRepository,
  taskRepository: TaskRepository,
  transactionRunner: TransactionRunner,
): AgentTaskService {
  const orchestrate = async (
    input: AgentTaskRequest,
  ): Promise<AgentTaskResponse> => {
    validateConversation(input);
    const [skills, categories] = await Promise.all([
      skillRepository.list(),
      categoryRepository.list(),
    ]);
    const listedSkillIds = new Set(skills.map((skill) => skill.id));

    let result;
    try {
      result = await provider.decide({
        messages: input.messages,
        skills,
        categories,
      });
    } catch (error) {
      if (error instanceof AgentOrchestrationProviderError) {
        throw new AgentUnavailableError(
          "Agent planning is not available right now.",
          { cause: error },
        );
      }
      throw error;
    }

    const decision = result.decision;
    if (!result.skillCatalogListed) {
      throw new AgentUnavailableError(
        "Agent planning did not inspect the current skill catalog.",
      );
    }

    return transactionRunner.run(async (tx) => {
      const [currentSkills, developers, workloads] = await Promise.all([
        skillRepository.list(tx),
        developerRepository.list(tx),
        taskRepository.countActiveAssignmentsByDeveloper(tx),
      ]);
      const currentSkillIds = new Set(currentSkills.map((skill) => skill.id));
      validatePlanSkills(decision.tasks, listedSkillIds, currentSkillIds);

      const tasks: Task[] = [];
      const staffingGaps: AgentTaskStaffingGap[] = [];
      await createTree(
        decision.tasks,
        null,
        1,
        developers,
        workloads,
        tx,
        tasks,
        staffingGaps,
      );
      return createdResponse(tasks, staffingGaps);
    });
  };

  const createTree = async (
    nodes: PlannedTaskNode[],
    parentTaskId: string | null,
    depth: number,
    developers: Developer[],
    workloads: Map<string, number>,
    tx: TransactionClient,
    created: Task[],
    staffingGaps: AgentTaskStaffingGap[],
  ): Promise<void> => {
    if (depth > MAX_TASK_DEPTH) {
      throw new ValidationError(
        `Tasks cannot be nested deeper than ${MAX_TASK_DEPTH} levels`,
      );
    }
    for (const node of nodes) {
      const requiredSkillIds = [...new Set(node.requiredSkillIds)];
      const assignee = selectAssignee(
        node,
        requiredSkillIds,
        developers,
        workloads,
      );
      const task = await taskRepository.create(
        {
          title: node.title,
          description: node.description,
          requiredSkillIds,
          parentTaskId,
          depth,
          assigneeId: assignee?.id ?? null,
        },
        tx,
      );
      created.push(task);
      if (assignee) {
        workloads.set(assignee.id, (workloads.get(assignee.id) ?? 0) + 1);
      } else {
        staffingGaps.push({
          taskId: task.id,
          taskTitle: task.title,
          requiredRole: node.requiredRole,
          requiredSkillIds,
          ...(node.unmatchedSkillRequirements.length > 0
            ? { unmatchedSkillRequirements: node.unmatchedSkillRequirements }
            : {}),
        });
      }
      await createTree(
        node.subtasks,
        task.id,
        depth + 1,
        developers,
        workloads,
        tx,
        created,
        staffingGaps,
      );
    }
  };

  return { orchestrate };
}

function validateConversation(input: AgentTaskRequest): void {
  const { messages } = input;
  const totalCharacters = messages.reduce(
    (sum, message) => sum + message.content.length,
    0,
  );
  if (
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages[0]?.role !== "user" ||
    messages.at(-1)?.role !== "user" ||
    totalCharacters > MAX_CONVERSATION_CHARACTERS
  ) {
    throw new ValidationError(
      "Agent conversation is invalid or exceeds its limits.",
    );
  }
}

function validatePlanSkills(
  nodes: PlannedTaskNode[],
  listedSkillIds: Set<string>,
  currentSkillIds: Set<string>,
): void {
  for (const node of nodes) {
    for (const skillId of node.requiredSkillIds) {
      if (!listedSkillIds.has(skillId) || !currentSkillIds.has(skillId)) {
        throw new AgentUnavailableError(
          "Agent planning returned an invalid skill reference.",
        );
      }
    }
    validatePlanSkills(node.subtasks, listedSkillIds, currentSkillIds);
  }
}

function selectAssignee(
  node: PlannedTaskNode,
  requiredSkillIds: string[],
  developers: Developer[],
  workloads: Map<string, number>,
): Developer | undefined {
  if (node.unmatchedSkillRequirements.length > 0) return undefined;
  return developers
    .filter((developer) =>
      requiredSkillIds.every((skillId) => developer.skillIds.includes(skillId)),
    )
    .sort(
      (left, right) =>
        (workloads.get(left.id) ?? 0) - (workloads.get(right.id) ?? 0) ||
        left.id.localeCompare(right.id),
    )[0];
}

function createdResponse(
  tasks: Task[],
  staffingGaps: AgentTaskStaffingGap[],
): AgentTaskCreatedResponse {
  let message = `Created ${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}.`;
  if (staffingGaps.length === 1) {
    message += ` One task remains unassigned and requires ${staffingGaps[0]!.requiredRole}.`;
  } else if (staffingGaps.length > 1) {
    message += ` ${staffingGaps.length} tasks remain unassigned; see staffingGaps for required roles.`;
  }
  return { status: "created", message, tasks, staffingGaps };
}
