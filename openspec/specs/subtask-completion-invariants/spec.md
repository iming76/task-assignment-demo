# subtask-completion-invariants Specification

## Purpose

This capability defines the externally verifiable behavior for subtask completion invariants so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Completion ordering

The API MUST reject completing a task while any descendant at any depth remains TODO.

#### Scenario: Incomplete grandchild exists

- **WHEN** a client attempts to mark a root DONE while its grandchild is TODO
- **THEN** the write is rejected with SUBTASKS_INCOMPLETE

### Requirement: Reopening and child creation ordering

The API MUST reject any write that would place a TODO task below a DONE ancestor.

#### Scenario: Completed ancestor exists

- **WHEN** a client reopens a descendant or creates a child beneath a completed task
- **THEN** the write is rejected with COMPLETED_ANCESTOR
