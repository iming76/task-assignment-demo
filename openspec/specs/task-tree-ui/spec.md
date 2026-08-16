# task-tree-ui Specification

## Purpose

This capability defines the externally verifiable behavior for task tree ui so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Arbitrary-depth task tree

The frontend SHALL derive and render an arbitrary-depth hierarchy from the flat task response while retaining orphaned tasks safely.

#### Scenario: Three-level response rendered

- **WHEN** the API returns a root, child, and grandchild plus an orphan
- **THEN** the UI displays every task at an understandable depth without infinite recursion

### Requirement: Guided task mutations

The task UI SHALL support root/child creation up to three one-based levels, edits, eligible assignment, skill correction, and confirmed deletion through the typed API.

#### Scenario: User creates a grandchild

- **WHEN** the user submits the child form beneath a second-level task
- **THEN** the request contains that task identifier as parentTaskId and the refreshed tree shows the new grandchild

#### Scenario: User views a third-level task

- **WHEN** the UI renders a task at depth `3`
- **THEN** it does not offer an action to add a subtask beneath that task
