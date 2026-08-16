import type {
  AgentTaskDraft,
  ApiErrorResponse,
  CreateTaskInput,
} from "../src/index.js";

// @ts-expect-error CreateTaskInput requires title and description.
export const missingRequiredFields: CreateTaskInput = {
  requiredSkillIds: [],
};

export const clientSuppliedDepth: CreateTaskInput = {
  title: "Wire up assignment endpoint",
  description: "Add the endpoint.",
  // @ts-expect-error depth is server-managed and must not be supplied by clients.
  depth: 1,
};

export const invalidRecursion: AgentTaskDraft = {
  name: "Root",
  description: "Root task.",
  requiredSkillIds: [],
  subtasks: [
    {
      name: "Child",
      description: "Child task.",
      requiredSkillIds: [],
      // @ts-expect-error subtasks must be an array of AgentTaskDraft, not a string.
      subtasks: "not-an-array",
    },
  ],
};

export const unknownErrorCode: ApiErrorResponse = {
  error: {
    // @ts-expect-error error codes are limited to the documented closed union.
    code: "UNKNOWN_ERROR",
    message: "This code does not exist.",
  },
};
