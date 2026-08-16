import type { JsonSchema } from "../schema.js";
import { taskSchema } from "../tasks/schema.js";

const agentTaskMessageSchema: JsonSchema = {
  type: "object",
  required: ["role", "content"],
  additionalProperties: false,
  properties: {
    role: { type: "string", enum: ["user", "assistant"] },
    content: { type: "string", minLength: 1, maxLength: 5000 },
  },
};

export const agentTaskRequestSchema: JsonSchema = {
  type: "object",
  required: ["messages"],
  additionalProperties: false,
  properties: {
    messages: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: agentTaskMessageSchema,
    },
  },
};

const staffingGapSchema: JsonSchema = {
  type: "object",
  required: ["taskId", "taskTitle", "requiredRole", "requiredSkillIds"],
  additionalProperties: false,
  properties: {
    taskId: { type: "string" },
    taskTitle: { type: "string" },
    requiredRole: { type: "string" },
    requiredSkillIds: { type: "array", items: { type: "string" } },
    unmatchedSkillRequirements: {
      type: "array",
      items: { type: "string" },
    },
  },
};

export const agentTaskCreatedResponseSchema: JsonSchema = {
  type: "object",
  required: ["status", "message", "tasks", "staffingGaps"],
  additionalProperties: false,
  properties: {
    status: { const: "created" },
    message: { type: "string" },
    tasks: { type: "array", items: taskSchema },
    staffingGaps: { type: "array", items: staffingGapSchema },
  },
};
