import type { FastifyInstance } from "fastify";
import { errorResponseSchema, idParamsSchema } from "../schema.js";
import { notImplementedHandler } from "../handler-types.js";
import type { DeveloperHandlers } from "./handlers.js";
import {
  createDeveloperInputSchema,
  developerSchema,
  patchDeveloperInputSchema,
} from "./schema.js";

export function registerDeveloperRoutes(
  app: FastifyInstance,
  handlers: Partial<DeveloperHandlers> = {},
): void {
  app.get(
    "/developers",
    {
      schema: { response: { 200: { type: "array", items: developerSchema } } },
    },
    handlers.listDevelopers ?? notImplementedHandler,
  );

  app.post(
    "/developers",
    {
      schema: {
        body: createDeveloperInputSchema,
        response: {
          201: developerSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    handlers.createDeveloper ?? notImplementedHandler,
  );

  app.get(
    "/developers/:id",
    {
      schema: {
        params: idParamsSchema,
        response: { 200: developerSchema, 404: errorResponseSchema },
      },
    },
    handlers.getDeveloper ?? notImplementedHandler,
  );

  app.patch(
    "/developers/:id",
    {
      schema: {
        params: idParamsSchema,
        body: patchDeveloperInputSchema,
        response: {
          200: developerSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    handlers.updateDeveloper ?? notImplementedHandler,
  );

  app.delete(
    "/developers/:id",
    {
      schema: {
        params: idParamsSchema,
        response: { 404: errorResponseSchema, 409: errorResponseSchema },
      },
    },
    handlers.deleteDeveloper ?? notImplementedHandler,
  );
}
