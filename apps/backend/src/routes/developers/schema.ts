import type { JsonSchema } from "../schema.js";

export const developerSchema: JsonSchema = {
  type: "object",
  required: ["id", "name", "skillIds"],
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    skillIds: { type: "array", items: { type: "string" } },
  },
};

export const createDeveloperInputSchema: JsonSchema = {
  type: "object",
  required: ["name"],
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1 },
    skillIds: { type: "array", items: { type: "string" } },
  },
};

export const patchDeveloperInputSchema: JsonSchema = {
  type: "object",
  minProperties: 1,
  additionalProperties: false,
  properties: {
    name: { type: "string", minLength: 1 },
    skillIds: { type: "array", items: { type: "string" } },
  },
};
