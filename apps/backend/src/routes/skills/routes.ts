import type { FastifyInstance } from "fastify";
import { errorResponseSchema, idParamsSchema } from "../schema.js";
import { notImplementedHandler } from "../handler-types.js";
import type { SkillHandlers } from "./handlers.js";
import {
  createSkillInputSchema,
  patchSkillInputSchema,
  skillSchema,
} from "./schema.js";

export function registerSkillRoutes(
  app: FastifyInstance,
  handlers: Partial<SkillHandlers> = {},
): void {
  app.get(
    "/skills",
    { schema: { response: { 200: { type: "array", items: skillSchema } } } },
    handlers.listSkills ?? notImplementedHandler,
  );

  app.post(
    "/skills",
    {
      schema: {
        body: createSkillInputSchema,
        response: {
          201: skillSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    handlers.createSkill ?? notImplementedHandler,
  );

  app.get(
    "/skills/:id",
    {
      schema: {
        params: idParamsSchema,
        response: { 200: skillSchema, 404: errorResponseSchema },
      },
    },
    handlers.getSkill ?? notImplementedHandler,
  );

  app.patch(
    "/skills/:id",
    {
      schema: {
        params: idParamsSchema,
        body: patchSkillInputSchema,
        response: {
          200: skillSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    handlers.updateSkill ?? notImplementedHandler,
  );

  app.delete(
    "/skills/:id",
    {
      schema: {
        params: idParamsSchema,
        response: { 404: errorResponseSchema, 409: errorResponseSchema },
      },
    },
    handlers.deleteSkill ?? notImplementedHandler,
  );
}
