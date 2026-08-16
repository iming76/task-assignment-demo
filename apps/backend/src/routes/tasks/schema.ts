import type { JsonSchema } from "../schema.js";

export const taskSchema: JsonSchema = {
  type: "object",
  required: [
    "id",
    "title",
    "description",
    "status",
    "depth",
    "assigneeId",
    "parentTaskId",
    "requiredSkillIds",
    "createdAt",
    "updatedAt",
  ],
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    description: { type: "string" },
    status: { type: "string", enum: ["TODO", "DONE"] },
    depth: { type: "integer", minimum: 1 },
    assigneeId: { type: ["string", "null"] },
    parentTaskId: { type: ["string", "null"] },
    requiredSkillIds: { type: "array", items: { type: "string" } },
    createdAt: { type: "string" },
    updatedAt: { type: "string" },
  },
};

export const createTaskInputSchema: JsonSchema = {
  type: "object",
  required: ["title", "description"],
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1 },
    description: { type: "string", minLength: 1 },
    requiredSkillIds: { type: "array", items: { type: "string" } },
    parentTaskId: { type: ["string", "null"] },
  },
};

export const patchTaskInputSchema: JsonSchema = {
  type: "object",
  minProperties: 1,
  additionalProperties: false,
  properties: {
    title: { type: "string", minLength: 1 },
    description: { type: "string", minLength: 1 },
    assigneeId: { type: ["string", "null"] },
    requiredSkillIds: { type: "array", items: { type: "string" } },
    status: { type: "string", enum: ["TODO", "DONE"] },
  },
};
