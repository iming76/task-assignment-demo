import type {
  Category,
  Developer,
  Skill,
  Task,
  TaskStatus,
} from "@repo/shared-types";

const status: TaskStatus = "TODO";

const category: Category = {
  id: "00000000-0000-0000-0000-000000000001",
  name: "Backend",
};

const skill: Skill = {
  id: "00000000-0000-0000-0000-000000000002",
  name: "Node.js",
  description: "Server-side JavaScript runtime.",
  categoryId: category.id,
};

const developer: Developer = {
  id: "00000000-0000-0000-0000-000000000003",
  name: "Ada Lovelace",
  skillIds: [skill.id],
};

const task: Task = {
  id: "00000000-0000-0000-0000-000000000004",
  title: "Ship the shared types package",
  description: "Publish canonical domain models.",
  status,
  depth: 1,
  assigneeId: developer.id,
  parentTaskId: null,
  requiredSkillIds: [skill.id],
};

export { category, developer, skill, task };
