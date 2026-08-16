import type { FastifyReply, FastifyRequest } from "fastify";
import type {
  CreateDeveloperInput,
  PatchDeveloperInput,
} from "@repo/shared-types";
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
    async listDevelopers() {
      return service.list();
    },

    async getDeveloper(request: FastifyRequest) {
      const { id } = request.params as { id: string };
      return service.get(id);
    },

    async createDeveloper(request: FastifyRequest, reply: FastifyReply) {
      const developer = await service.create(
        request.body as CreateDeveloperInput,
      );
      reply.status(201);
      return developer;
    },

    async updateDeveloper(request: FastifyRequest) {
      const { id } = request.params as { id: string };
      return service.update(id, request.body as PatchDeveloperInput);
    },

    async deleteDeveloper(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string };
      await service.remove(id);
      return reply.status(204).send();
    },
  };
}
