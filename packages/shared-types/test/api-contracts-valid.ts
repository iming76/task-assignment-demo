import type {
  AgentTaskRequest,
  AgentTaskResponse,
  ApiErrorResponse,
  CreateDeveloperInput,
  CreateSkillInput,
  CreateTaskInput,
  PatchTaskInput,
} from "../src/index.js";

export const createTaskWithOmittedSkills: CreateTaskInput = {
  title: "Wire up assignment endpoint",
  description: "Add the endpoint and enforce skill eligibility.",
};
export const createTaskWithExplicitEmptySkills: CreateTaskInput = {
  ...createTaskWithOmittedSkills,
  requiredSkillIds: [],
};
export const skillOmitted = !(
  "requiredSkillIds" in createTaskWithOmittedSkills
);
export const skillExplicitlyEmpty =
  "requiredSkillIds" in createTaskWithExplicitEmptySkills &&
  createTaskWithExplicitEmptySkills.requiredSkillIds?.length === 0;
export const patchTaskStatusOnly: PatchTaskInput = { status: "DONE" };
export const createDeveloperWithoutSkills: CreateDeveloperInput = {
  name: "Alice",
};
export const createSkill: CreateSkillInput = {
  name: "Node.js",
  description: "Server-side JavaScript runtime.",
  categoryId: "category-backend",
};
export const agentTaskRequest: AgentTaskRequest = {
  messages: [{ role: "user", content: "Build a task assignment system." }],
};
export const createdResponse: AgentTaskResponse = {
  status: "created",
  message: "Task created; an AI Engineer is still required.",
  tasks: [],
  staffingGaps: [
    {
      taskId: "task-ai",
      taskTitle: "Build image moderation",
      requiredRole: "AI Engineer",
      requiredSkillIds: ["skill-ai"],
    },
  ],
};
export const validationError: ApiErrorResponse = {
  error: { code: "VALIDATION_ERROR", message: "title is required" },
};
