import type { FastifyRequest } from "fastify";
import type { RouteHandler } from "../handler-types.js";
import type { CategoryService } from "../../services/category-service.js";

/** Implemented by add-resource-read-api. */
export interface CategoryHandlers {
  listCategories: RouteHandler;
  getCategory: RouteHandler;
}

/**
 * Factory function to create handler implementations for categories using injected service.
 * add-resource-read-api implements both listCategories and getCategory.
 */
export function createCategoryHandlers(
  service: CategoryService,
): CategoryHandlers {
  return {
    async listCategories() {
      return service.list();
    },

    async getCategory(request: FastifyRequest) {
      const { id } = request.params as { id: string };
      return service.get(id);
    },
  };
}
