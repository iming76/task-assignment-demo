import type { Task } from "./task.js";

export interface AgentTaskDraft {
  name: string;
  description: string;
  assigneeId?: string | null;
  requiredSkillIds: string[];
  subtasks: AgentTaskDraft[];
}

export interface AgentTaskProposalRequest {
  description: string;
}

export interface AgentTaskProposalResponse {
  tasks: AgentTaskDraft[];
}

export interface AgentTaskApplyRequest {
  tasks: AgentTaskDraft[];
}

export type AgentTaskApplyResponse = Task[];
