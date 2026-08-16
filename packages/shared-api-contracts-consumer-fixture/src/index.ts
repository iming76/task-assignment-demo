import type {
  AgentTaskApplyRequest,
  AgentTaskApplyResponse,
  AgentTaskDraft,
  AgentTaskProposalRequest,
  AgentTaskProposalResponse,
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
  title: "Wire up assignment endpoint",
  description: "Add the endpoint and enforce skill eligibility.",
  requiredSkillIds: [],
};

const patchTask: PatchTaskInput = {
  status: "DONE",
};

const createDeveloper: CreateDeveloperInput = {
  name: "Alice",
  skillIds: ["skill-backend"],
};

const createSkill: CreateSkillInput = {
  name: "Node.js",
  description: "Server-side JavaScript runtime.",
  categoryId: "category-backend",
};

const draft: AgentTaskDraft = {
  name: "Build the frontend",
  description: "Create the React task-management experience.",
  assigneeId: "dev-alice",
  requiredSkillIds: ["skill-react"],
  subtasks: [
    {
      name: "Wire up the task tree",
      description: "Render tasks recursively.",
      requiredSkillIds: [],
      subtasks: [],
    },
  ],
};

const proposalRequest: AgentTaskProposalRequest = {
  description: "Build a task assignment system.",
};

const proposalResponse: AgentTaskProposalResponse = {
  tasks: [draft],
};

const applyRequest: AgentTaskApplyRequest = {
  tasks: [draft],
};

const applyResponse: AgentTaskApplyResponse = [];
const taskListResponse: TaskListResponse = applyResponse;

const errorResponse: ApiErrorResponse = {
  error: {
    code: "SKILL_MISMATCH",
    message: "Assignee's skills do not cover the task's required skills.",
  },
};

export {
  applyRequest,
  applyResponse,
  createDeveloper,
  createSkill,
  createTaskWithExplicitSkills,
  createTaskWithInferredSkills,
  errorResponse,
  patchTask,
  proposalRequest,
  proposalResponse,
  taskListResponse,
};
