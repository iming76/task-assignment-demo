/** Plain JSON Schema objects, imported directly into each resource's route schema. */
export type JsonSchema = Record<string, unknown>;

export const idSchema: JsonSchema = {
  type: "string",
  description: "UUID identifying the resource.",
};

/** Shared `schema.params` shape for every `/<resource>/:id` route. */
export const idParamsSchema: JsonSchema = {
  type: "object",
  properties: { id: idSchema },
  required: ["id"],
};

export const errorResponseSchema: JsonSchema = {
  type: "object",
  required: ["error"],
  additionalProperties: false,
  properties: {
    error: {
      type: "object",
      required: ["code", "message"],
      additionalProperties: false,
      properties: {
        code: {
          type: "string",
          enum: [
            "VALIDATION_ERROR",
            "NOT_FOUND",
            "SKILL_MISMATCH",
            "SUBTASKS_INCOMPLETE",
            "COMPLETED_ANCESTOR",
            "IN_USE",
            "AGENT_UNAVAILABLE",
            "INTERNAL_ERROR",
          ],
        },
        message: { type: "string" },
      },
    },
  },
};
