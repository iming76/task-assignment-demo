import type { FastifyInstance } from "fastify";
import { errorResponseSchema, idParamsSchema } from "../schema.js";
import { notImplementedHandler } from "../handler-types.js";
import type { TaskHandlers } from "./handlers.js";
import {
  createTaskInputSchema,
  patchTaskInputSchema,
  taskSchema,
} from "./schema.js";

export function registerTaskRoutes(
  app: FastifyInstance,
  handlers: Partial<TaskHandlers> = {},
): void {
  app.get(
    "/tasks",
    { schema: { response: { 200: { type: "array", items: taskSchema } } } },
    handlers.listTasks ?? notImplementedHandler,
  );

  app.post(
    "/tasks",
    {
      schema: {
        body: createTaskInputSchema,
        response: {
          201: taskSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    handlers.createTask ?? notImplementedHandler,
  );

  app.get(
    "/tasks/:id",
    {
      schema: {
        params: idParamsSchema,
        response: { 200: taskSchema, 404: errorResponseSchema },
      },
    },
    handlers.getTask ?? notImplementedHandler,
  );

  app.patch(
    "/tasks/:id",
    {
      schema: {
        params: idParamsSchema,
        body: patchTaskInputSchema,
        response: {
          200: taskSchema,
          400: errorResponseSchema,
          404: errorResponseSchema,
          409: errorResponseSchema,
        },
      },
    },
    handlers.updateTask ?? notImplementedHandler,
  );

  app.delete(
    "/tasks/:id",
    {
      schema: {
        params: idParamsSchema,
        response: { 404: errorResponseSchema, 409: errorResponseSchema },
      },
    },
    handlers.deleteTask ?? notImplementedHandler,
  );
}
