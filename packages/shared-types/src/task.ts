export type TaskStatus = "TODO" | "DONE";

export const MAX_TASK_DEPTH = 3;

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  depth: number;
  assigneeId: string | null;
  parentTaskId: string | null;
  requiredSkillIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  requiredSkillIds?: string[];
  parentTaskId?: string | null;
}

export interface PatchTaskInput {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  requiredSkillIds?: string[];
  status?: TaskStatus;
}

export type TaskResponse = Task;
export type TaskListResponse = Task[];
