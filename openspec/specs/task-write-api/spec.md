## Purpose

This capability defines the externally verifiable behavior for task write api so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Validated task mutations

The API SHALL create and patch tasks transactionally while validating referenced parents, skills, and developers.

#### Scenario: Valid task write

- **WHEN** a client submits a valid create or non-empty patch request
- **THEN** the server commits the complete mutation and returns the public Task shape

### Requirement: Skill-complete assignment

The API MUST reject assignment unless the selected developer covers every effective required skill and MUST NOT silently unassign an invalidated assignee.

#### Scenario: Partial skill match submitted

- **WHEN** a task write assigns or retains a developer missing at least one required skill
- **THEN** the entire write is rejected with SKILL_MISMATCH

### Requirement: Maximum task depth

The API MUST limit task hierarchies to three one-based levels.

#### Scenario: Fourth-level task submitted

- **WHEN** a client creates a task beneath a third-level task
- **THEN** the entire write is rejected with VALIDATION_ERROR and no task is created
