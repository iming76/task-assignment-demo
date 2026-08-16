import type {
  AgentTaskApplyRequest,
  AgentTaskDraft,
  AgentTaskProposalRequest,
  AgentTaskProposalResponse,
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
  title: "Wire up assignment endpoint",
  description: "Add the endpoint and enforce skill eligibility.",
  requiredSkillIds: [],
};

export const skillOmitted = !(
  "requiredSkillIds" in createTaskWithOmittedSkills
);
export const skillExplicitlyEmpty =
  "requiredSkillIds" in createTaskWithExplicitEmptySkills &&
  createTaskWithExplicitEmptySkills.requiredSkillIds?.length === 0;

export const patchTaskStatusOnly: PatchTaskInput = {
  status: "DONE",
};

export const createDeveloperWithoutSkills: CreateDeveloperInput = {
  name: "Alice",
};

export const createSkill: CreateSkillInput = {
  name: "Node.js",
  description: "Server-side JavaScript runtime.",
  categoryId: "category-backend",
};

const deeplyNestedDraft: AgentTaskDraft = {
  name: "Root",
  description: "Root task.",
  requiredSkillIds: [],
  subtasks: [
    {
      name: "Child",
      description: "Child task.",
      requiredSkillIds: ["skill-1"],
      subtasks: [
        {
          name: "Grandchild",
          description: "Grandchild task.",
          assigneeId: null,
          requiredSkillIds: [],
          subtasks: [
            {
              name: "Great-grandchild",
              description: "Arbitrary depth is representable.",
              requiredSkillIds: [],
              subtasks: [],
            },
          ],
        },
      ],
    },
  ],
};

export const agentProposalRequest: AgentTaskProposalRequest = {
  description: "Build a task assignment system.",
};

export const agentProposalResponse: AgentTaskProposalResponse = {
  tasks: [deeplyNestedDraft],
};

export const agentApplyRequest: AgentTaskApplyRequest = {
  tasks: [deeplyNestedDraft],
};

export const validationError: ApiErrorResponse = {
  error: {
    code: "VALIDATION_ERROR",
    message: "title is required",
  },
};
