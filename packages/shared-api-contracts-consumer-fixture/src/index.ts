import type {
  AgentTaskRequest,
  AgentTaskResponse,
  ApiErrorResponse,
  CreateDeveloperInput,
  CreateSkillInput,
  CreateTaskInput,
  PatchTaskInput,
  TaskListResponse,
} from "@repo/shared-types";

const createTaskWithInferredSkills: CreateTaskInput = {
  title: "Wire up assignment endpoint",
  description: "Add the endpoint and enforce skill eligibility.",
};
const createTaskWithExplicitSkills: CreateTaskInput = {
  ...createTaskWithInferredSkills,
  requiredSkillIds: [],
};
const patchTask: PatchTaskInput = { status: "DONE" };
const createDeveloper: CreateDeveloperInput = {
  name: "Alice",
  skillIds: ["skill-backend"],
};
const createSkill: CreateSkillInput = {
  name: "Node.js",
  description: "Server-side JavaScript runtime.",
  categoryId: "category-backend",
};
const agentTaskRequest: AgentTaskRequest = {
  messages: [{ role: "user", content: "Build a task assignment system." }],
};
const agentTaskResponse: AgentTaskResponse = {
  status: "needs_clarification",
  question: "Which platforms are required?",
};
const taskListResponse: TaskListResponse = [];
const errorResponse: ApiErrorResponse = {
  error: { code: "SKILL_MISMATCH", message: "Skills do not match." },
};

export {
  agentTaskRequest,
  agentTaskResponse,
  createDeveloper,
  createSkill,
  createTaskWithExplicitSkills,
  createTaskWithInferredSkills,
  errorResponse,
  patchTask,
  taskListResponse,
};
