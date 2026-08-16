import type { RouteHandler } from "../handler-types.js";

/** Implemented by add-resource-read-api. */
export interface CategoryHandlers {
  listCategories: RouteHandler;
  getCategory: RouteHandler;
}
