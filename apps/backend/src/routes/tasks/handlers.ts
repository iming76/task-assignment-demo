import type { RouteHandler } from "../handler-types.js";

/** Implemented by add-resource-read-api and add-task-write-api. */
export interface TaskHandlers {
  listTasks: RouteHandler;
  createTask: RouteHandler;
  getTask: RouteHandler;
  updateTask: RouteHandler;
  deleteTask: RouteHandler;
}
