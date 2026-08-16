import type { JsonSchema } from "../schema.js";
import { taskSchema } from "../tasks/schema.js";

/**
 * Registered once (with its own $id) via `app.addSchema` in routes.ts, and
 * referenced by `$ref: "AgentTaskDraft#"` rather than inlined, because
 * `subtasks` points back at this same schema and an inlined copy would
 * expand forever.
 */
export const agentTaskDraftSchema: JsonSchema = {
  $id: "AgentTaskDraft",
  type: "object",
  required: ["name", "description", "requiredSkillIds", "subtasks"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1 },
    description: { type: "string", minLength: 1 },
    assigneeId: { type: ["string", "null"] },
    requiredSkillIds: { type: "array", items: { type: "string" } },
    subtasks: {
      type: "array",
      items: { $ref: "AgentTaskDraft#" },
    },
  },
};

export const agentTaskProposalRequestSchema: JsonSchema = {
  type: "object",
  required: ["description"],
  additionalProperties: false,
  properties: {
    description: { type: "string", minLength: 1 },
  },
};

export const agentTaskProposalResponseSchema: JsonSchema = {
  type: "object",
  required: ["tasks"],
  additionalProperties: false,
  properties: {
    tasks: { type: "array", items: { $ref: "AgentTaskDraft#" } },
  },
};

export const agentTaskApplyRequestSchema: JsonSchema = {
  type: "object",
  required: ["tasks"],
  additionalProperties: false,
  properties: {
    tasks: {
      type: "array",
      minItems: 1,
      items: { $ref: "AgentTaskDraft#" },
    },
  },
};

export const agentTaskApplyResponseSchema: JsonSchema = {
  type: "array",
  items: taskSchema,
};
