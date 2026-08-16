## Purpose

This capability defines the externally verifiable behavior for frontend application shell so downstream changes can rely on a stable boundary.

## ADDED Requirements

### Requirement: Navigable application routes

The frontend SHALL provide dashboard, developer, skill, task, and agent-task routes through client-side navigation.

#### Scenario: User follows navigation

- **WHEN** a user selects any configured primary navigation item
- **THEN** the matching route renders without a full-page browser reload

### Requirement: Backend-independent shell states

The application shell SHALL render consistent loading, empty, error, and not-found frames without requiring backend availability.

#### Scenario: Shell tests run

- **WHEN** route-shell tests execute with no backend running
- **THEN** each state renders using shared UI primitives
