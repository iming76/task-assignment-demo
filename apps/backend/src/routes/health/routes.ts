import type { FastifyInstance } from "fastify";
import { errorResponseSchema } from "../schema.js";
import type { RouteHandler } from "../handler-types.js";
import { healthResponseSchema } from "./schema.js";

export function registerHealthRoutes(
  app: FastifyInstance,
  handlers: { getHealth: RouteHandler },
): void {
  app.get(
    "/health",
    {
      schema: {
        response: { 200: healthResponseSchema, 500: errorResponseSchema },
      },
    },
    handlers.getHealth,
  );
}
