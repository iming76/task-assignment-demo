import type { RouteHandler } from "../handler-types.js";

/** Implemented by add-resource-read-api and add-resource-write-api. */
export interface SkillHandlers {
  listSkills: RouteHandler;
  createSkill: RouteHandler;
  getSkill: RouteHandler;
  updateSkill: RouteHandler;
  deleteSkill: RouteHandler;
}
