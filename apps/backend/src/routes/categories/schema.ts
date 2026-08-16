import type { JsonSchema } from "../schema.js";

export const categorySchema: JsonSchema = {
  type: "object",
  required: ["id", "name"],
  additionalProperties: false,
  properties: {
    id: { type: "string" },
    name: { type: "string" },
  },
};
