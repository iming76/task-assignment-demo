import type { Task, TaskStatus } from "../src/index.js";

// @ts-expect-error TaskStatus only allows "TODO" or "DONE", not an arbitrary string.
export const invalidStatus: TaskStatus = "IN_PROGRESS";

// @ts-expect-error A Task must include every required field.
export const incompleteTask: Task = {
  id: "task-3",
  title: "Incomplete task",
};

export const malformedStatusTask: Task = {
  id: "task-4",
  title: "Malformed task",
  description: "Uses an invalid status.",
  // @ts-expect-error status must be a member of TaskStatus, not an arbitrary string.
  status: "BLOCKED",
  depth: 1,
  assigneeId: null,
  parentTaskId: null,
  requiredSkillIds: [],
};
