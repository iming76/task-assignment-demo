## Purpose

This capability defines the externally verifiable behavior for resource management ui so downstream changes can rely on a stable boundary.

## ADDED Requirements

### Requirement: Resource management routes

The frontend SHALL provide dashboard, developer management, and skill management experiences backed by the typed API.

#### Scenario: User manages resources

- **WHEN** a user creates or edits a developer or creates a skill with an API-provided category
- **THEN** the relevant route reflects the successful server response

### Requirement: Confirmed safe deletion

The frontend MUST require confirmation before developer or skill deletion and SHALL explain documented IN_USE failures.

#### Scenario: User attempts deletion

- **WHEN** the user cancels or confirms a resource deletion
- **THEN** cancel sends no request, while confirm sends one request and presents its final result
