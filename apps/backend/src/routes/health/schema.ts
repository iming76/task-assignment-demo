import type { JsonSchema } from "../schema.js";

export const healthResponseSchema: JsonSchema = {
  type: "object",
  required: ["status"],
  additionalProperties: false,
  properties: {
    status: { type: "string", enum: ["ok"] },
  },
};
