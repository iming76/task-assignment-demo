## 1. Schema and migration

- [x] 1.1 Define UUID-backed Developer, Category, Skill, and Task models
- [x] 1.2 Add explicit DeveloperSkill and TaskSkill join models, uniqueness constraints, and indexes
- [x] 1.3 Add nullable assignee and self-referencing parent relations with documented delete behavior
- [x] 1.4 Map documented snake_case names and create the initial migration

## 2. Persistence verification

- [x] 2.1 Test uniqueness, required descriptions, duplicate joins, and restricted deletes
- [x] 2.2 Test root, child, and grandchild persistence
- [x] 2.3 Apply the migration to an empty PostgreSQL database and generate Prisma Client
