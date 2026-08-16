## Purpose

This capability defines the externally verifiable behavior for relational task schema so downstream changes can rely on a stable boundary.

## ADDED Requirements

### Requirement: Normalized assignment data

The database SHALL persist developers, categories, described skills, tasks, and explicit developer/task skill relationships with enforced uniqueness and references.

#### Scenario: Fresh migration

- **WHEN** the initial migration is applied to an empty PostgreSQL database
- **THEN** all documented tables, foreign keys, unique constraints, and indexes exist

### Requirement: Arbitrary-depth task relations

The database SHALL allow each task to reference one nullable parent task and one nullable assignee without imposing a fixed hierarchy depth. Each task SHALL persist a one-based depth, with root tasks defaulting to depth `1` and child tasks storing their parent's depth plus one.

#### Scenario: Three-level hierarchy

- **WHEN** a root, child, and grandchild are inserted with valid references
- **THEN** all records persist with depths `1`, `2`, and `3`, and each child retains the correct parent identifier
