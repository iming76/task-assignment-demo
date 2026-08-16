import type { FastifyReply, FastifyRequest } from "fastify";
import type { CreateSkillInput, PatchSkillInput } from "@repo/shared-types";
import type { RouteHandler } from "../handler-types.js";
import type { SkillService } from "../../services/skill-service.js";

/** Implemented by add-resource-read-api and add-resource-write-api. */
export interface SkillHandlers {
  listSkills: RouteHandler;
  createSkill: RouteHandler;
  getSkill: RouteHandler;
  updateSkill: RouteHandler;
  deleteSkill: RouteHandler;
}

/**
 * Factory function to create handler implementations for skills using injected service.
 * add-resource-read-api implements listSkills and getSkill.
 */
export function createSkillHandlers(service: SkillService): SkillHandlers {
  return {
    async listSkills(request: FastifyRequest, reply: FastifyReply) {
      return service.list();
    },

    async getSkill(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string };
      return service.get(id);
    },

    async createSkill(request: FastifyRequest, reply: FastifyReply) {
      const skill = await service.create(request.body as CreateSkillInput);
      reply.status(201);
      return skill;
    },

    async updateSkill(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string };
      return service.update(id, request.body as PatchSkillInput);
    },

    async deleteSkill(request: FastifyRequest, reply: FastifyReply) {
      const { id } = request.params as { id: string };
      await service.remove(id);
      return reply.status(204).send();
    },
  };
}
