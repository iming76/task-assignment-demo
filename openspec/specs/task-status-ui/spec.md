# task-status-ui Specification

## Purpose

This capability defines the externally verifiable behavior for task status ui so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Accurate status mutations

The task UI SHALL present TODO and DONE labels and reflect pending, successful, and failed status mutations without stale success.

#### Scenario: Status update fails

- **WHEN** a submitted status patch is rejected
- **THEN** the previous status remains visible and the rejection guidance is shown

### Requirement: Recursive conflict guidance

The UI SHALL provide leaf-up or root-down resolution guidance for the two recursive status conflict codes.

#### Scenario: Conflict returned

- **WHEN** the API returns SUBTASKS_INCOMPLETE or COMPLETED_ANCESTOR
- **THEN** the message identifies the required ordering without treating client logic as authoritative
