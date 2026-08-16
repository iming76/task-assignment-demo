import type { RouteHandler } from "../handler-types.js";

/** Implemented by add-resource-read-api and add-resource-write-api. */
export interface DeveloperHandlers {
  listDevelopers: RouteHandler;
  createDeveloper: RouteHandler;
  getDeveloper: RouteHandler;
  updateDeveloper: RouteHandler;
  deleteDeveloper: RouteHandler;
}
