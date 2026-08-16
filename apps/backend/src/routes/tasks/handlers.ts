import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateTaskInput, PatchTaskInput } from "@repo/shared-types";
import type { RouteHandler } from "../handler-types.js";
import type { TaskService } from "../../services/task-service.js";

export interface TaskHandlers {
  listTasks: RouteHandler;
  createTask: RouteHandler;
  getTask: RouteHandler;
  updateTask: RouteHandler;
  deleteTask: RouteHandler;
}

/** Factory function to create handler implementations for tasks using injected service. */
export function createTaskHandlers(service: TaskService): TaskHandlers {
  return {
    async listTasks() {
      return service.list();
    },

    async getTask(request: FastifyRequest) {
      const { id } = request.params as { id: string };
      return service.get(id);
    },

    async createTask(request: FastifyRequest, reply: FastifyReply) {
      const input = request.body as CreateTaskInput;
      const task = await service.create(input);
      reply.status(201);
      return task;
    },

    async updateTask(request: FastifyRequest) {
      const { id } = request.params as { id: string };
      const input = request.body as PatchTaskInput;
      return service.update(id, input);
    },

    async deleteTask(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string };
      await service.remove(id);
      reply.status(204);
    },
  };
}
