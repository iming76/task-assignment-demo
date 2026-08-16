import type {
  Category,
  Developer,
  Skill,
  Task,
  TaskStatus,
} from "../src/index.js";

export const validStatus: TaskStatus = "DONE";

export const validCategory: Category = {
  id: "cat-1",
  name: "Frontend",
};

export const validSkill: Skill = {
  id: "skill-1",
  name: "TypeScript",
  description: "Typed superset of JavaScript.",
  categoryId: validCategory.id,
};

export const validDeveloper: Developer = {
  id: "dev-1",
  name: "Ada Lovelace",
  skillIds: [validSkill.id],
};

export const validRootTask: Task = {
  id: "task-1",
  title: "Root task",
  description: "A top-level task.",
  status: validStatus,
  depth: 1,
  assigneeId: null,
  parentTaskId: null,
  requiredSkillIds: [validSkill.id],
};

export const validSubtask: Task = {
  id: "task-2",
  title: "Subtask",
  description: "A nested task.",
  status: "TODO",
  depth: 2,
  assigneeId: validDeveloper.id,
  parentTaskId: validRootTask.id,
  requiredSkillIds: [],
};
