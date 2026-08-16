---
title: Data Model
sidebar_position: 4
---

# Data Model

```
Developer
  id, name (unique)

Category
  id, name (unique)   (Frontend, Backend, ...)

Skill
  id, name (unique), description, category_id -> Category
  examples: JavaScript -> Frontend, Node.js -> Backend

DeveloperSkill (join table)
  developer_id, skill_id

Task
  id, title, description, status ("TODO" | "DONE")
  assignee_id  -> Developer (nullable)
  parent_task_id -> Task (nullable, self-referencing)

TaskSkill (join table)
  task_id, skill_id   (required skills)
```

These shapes will live as TypeScript interfaces in the planned `packages/shared-types`, e.g.:

```ts
// packages/shared-types/src/task.ts
export type TaskStatus = "TODO" | "DONE";

export interface Category {
  id: string;
  name: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  categoryId: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  assigneeId: string | null;
  parentTaskId: string | null;
  requiredSkillIds: string[];
}
```

Once implemented, both the backend (as the return/DTO shape) and frontend (as the fetched data shape) must import this instead of duplicating interface definitions. Additional statuses require an explicit contract and shared-type change; the union must not include a catch-all `string`.

## Skill Taxonomy

`Category` groups related skills without hardcoding categories into an enum.
Initial seed categories include `Frontend` and `Backend`. Skills contain a
required description that explains the capability in enough detail for the
assignment agent to distinguish related technologies and understand when each
skill applies.

```prisma
model Category {
  id     String  @id @default(uuid())
  name   String  @unique
  skills Skill[]

  @@map("categories")
}

model Skill {
  id          String @id @default(uuid())
  name        String @unique
  description String
  categoryId  String @map("category_id")

  category Category @relation(fields: [categoryId], references: [id], onDelete: Restrict)

  @@index([categoryId])
  @@map("skills")
}
```

`Developer.name`, `Category.name`, and `Skill.name` are each globally unique;
the database enforces these constraints. In particular, a skill name cannot be
reused in a different category. The agent receives the category name, skill
name, and skill description as controlled context, but writes only a validated
canonical skill ID. A category cannot be deleted while skills still reference
it.

## Task Hierarchy

Tasks form an arbitrary-depth hierarchy through the self-referencing
`parentTaskId`. Depth is not part of the persisted or shared `Task` shape;
clients derive it while traversing the hierarchy when needed.

The relevant part of the Prisma model is:

```prisma
model Task {
  id           String  @id @default(uuid())
  title        String
  description  String
  parentTaskId String? @map("parent_task_id")

  parent   Task?  @relation("TaskToSubtask", fields: [parentTaskId], references: [id], onDelete: Restrict)
  subtasks Task[] @relation("TaskToSubtask")

  @@index([parentTaskId])
  @@map("tasks")
}
```

The full model also contains the documented status, assignee, and required-skill
relations. `Restrict` preserves the API rule that a task with subtasks cannot be
deleted; the application must not silently cascade-delete its descendants.

On creation, the backend verifies that a supplied parent exists and relies on
the relation to preserve referential integrity. Any future re-parenting feature
must reject cycles. Re-parenting is not part of the current API.

## Completion Invariant

A task may be `"DONE"` only while every descendant is also `"DONE"`. To preserve that invariant:

- setting a task to `"DONE"` fails if any descendant is `"TODO"`;
- setting a task back to `"TODO"` fails while any ancestor is `"DONE"`; and
- creating a subtask beneath a `"DONE"` parent fails until the parent is reopened.

These checks are transactional and server-side so no write can leave a completed ancestor with an incomplete descendant.
