import type { FastifyInstance } from "fastify";
import { errorResponseSchema, idParamsSchema } from "../schema.js";
import { notImplementedHandler } from "../handler-types.js";
import type { CategoryHandlers } from "./handlers.js";
import { categorySchema } from "./schema.js";

export function registerCategoryRoutes(
  app: FastifyInstance,
  handlers: Partial<CategoryHandlers> = {},
): void {
  app.get(
    "/categories",
    { schema: { response: { 200: { type: "array", items: categorySchema } } } },
    handlers.listCategories ?? notImplementedHandler,
  );

  app.get(
    "/categories/:id",
    {
      schema: {
        params: idParamsSchema,
        response: { 200: categorySchema, 404: errorResponseSchema },
      },
    },
    handlers.getCategory ?? notImplementedHandler,
  );
}
