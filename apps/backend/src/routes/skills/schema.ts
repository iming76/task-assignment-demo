import type { JsonSchema } from "../schema.js";

export const skillSchema: JsonSchema = {
  type: "object",
  required: ["id", "name", "description", "categoryId"],
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    description: { type: "string" },
    categoryId: { type: "string" },
  },
};

export const createSkillInputSchema: JsonSchema = {
  type: "object",
  required: ["name", "description", "categoryId"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1 },
    description: { type: "string", minLength: 1 },
    categoryId: { type: "string" },
  },
};

export const patchSkillInputSchema: JsonSchema = {
  type: "object",
  minProperties: 1,
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1 },
    description: { type: "string", minLength: 1 },
    categoryId: { type: "string" },
  },
};
