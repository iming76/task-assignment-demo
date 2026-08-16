import type { FastifyReply, FastifyRequest } from "fastify";
import type { RouteHandler } from "../handler-types.js";
import type { TaskService } from "../../services/task-service.js";

/** Implemented by add-resource-read-api and add-task-write-api. */
export interface TaskHandlers {
  listTasks: RouteHandler;
  createTask: RouteHandler;
  getTask: RouteHandler;
  updateTask: RouteHandler;
  deleteTask: RouteHandler;
}

/**
 * Factory function to create handler implementations for tasks using injected service.
 * add-resource-read-api implements listTasks and getTask.
 */
export function createTaskHandlers(service: TaskService): TaskHandlers {
  return {
    async listTasks(request: FastifyRequest, reply: FastifyReply) {
      return service.list();
    },

    async getTask(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string };
      return service.get(id);
    },

    // Write operations implemented by add-task-write-api
    async createTask(request: FastifyRequest, reply: FastifyReply) {
      throw new Error("Not implemented");
    },

    async updateTask(request: FastifyRequest, reply: FastifyReply) {
      throw new Error("Not implemented");
    },

    async deleteTask(request: FastifyRequest, reply: FastifyReply) {
      throw new Error("Not implemented");
    },
  };
}
