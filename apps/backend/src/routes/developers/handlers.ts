import type { FastifyReply, FastifyRequest } from "fastify";
import type { RouteHandler } from "../handler-types.js";
import type { DeveloperService } from "../../services/developer-service.js";

/** Implemented by add-resource-read-api and add-resource-write-api. */
export interface DeveloperHandlers {
  listDevelopers: RouteHandler;
  createDeveloper: RouteHandler;
  getDeveloper: RouteHandler;
  updateDeveloper: RouteHandler;
  deleteDeveloper: RouteHandler;
}

/**
 * Factory function to create handler implementations for developers using injected service.
 * add-resource-read-api implements listDevelopers and getDeveloper.
 */
export function createDeveloperHandlers(
  service: DeveloperService,
): DeveloperHandlers {
  return {
    async listDevelopers(request: FastifyRequest, reply: FastifyReply) {
      return service.list();
    },

    async getDeveloper(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string };
      return service.get(id);
    },

    // Write operations implemented by add-resource-write-api
    async createDeveloper(request: FastifyRequest, reply: FastifyReply) {
      throw new Error("Not implemented");
    },

    async updateDeveloper(request: FastifyRequest, reply: FastifyReply) {
      throw new Error("Not implemented");
    },

    async deleteDeveloper(request: FastifyRequest, reply: FastifyReply) {
      throw new Error("Not implemented");
    },
  };
}
