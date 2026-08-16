import type { Task } from "./task.js";

export type AgentTaskMessageRole = "user" | "assistant";

export interface AgentTaskMessage {
  role: AgentTaskMessageRole;
  content: string;
}

export interface AgentTaskRequest {
  messages: AgentTaskMessage[];
}

export interface AgentTaskStaffingGap {
  taskId: string;
  taskTitle: string;
  requiredRole: string;
  requiredSkillIds: string[];
  unmatchedSkillRequirements?: string[];
}

export interface AgentTaskCreatedResponse {
  status: "created";
  message: string;
  tasks: Task[];
  staffingGaps: AgentTaskStaffingGap[];
}

export type AgentTaskResponse = AgentTaskCreatedResponse;
