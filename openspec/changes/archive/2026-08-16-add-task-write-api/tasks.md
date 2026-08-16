## 1. Task mutations

- [x] 1.1 Implement validated TODO/unassigned task creation with parent and supplied skills
- [x] 1.2 Preserve requiredSkillIds omission and add the temporary empty fallback seam
- [x] 1.3 Implement non-empty task patches, complete skill replacement, status values, and explicit unassignment
- [x] 1.4 Implement safe task deletion when no children exist

## 2. Assignment and transactions

- [x] 2.1 Enforce exact/superset eligibility and zero-skill assignment
- [x] 2.2 Reject skill replacement that invalidates the current assignee without silently unassigning
- [x] 2.3 Run multi-row validation and writes in one transaction

## 3. Integration tests

- [x] 3.1 Cover create, patch, assignment, replacement, unassignment, and deletion success
- [x] 3.2 Cover bad IDs, empty patches, mismatch, and in-use errors
- [x] 3.3 Run backend build, lint, type-check, and PostgreSQL integration tests
