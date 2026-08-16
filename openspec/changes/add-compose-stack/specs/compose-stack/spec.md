## Purpose

This capability defines the externally verifiable behavior for compose stack so downstream changes can rely on a stable boundary.

## ADDED Requirements

### Requirement: One-command stack startup

Docker Compose SHALL start PostgreSQL, initialize schema and application seeds, run the backend, and serve the frontend from a clean clone.

#### Scenario: Clean startup

- **WHEN** a user runs docker compose up --build with Docker as the only runtime prerequisite
- **THEN** all services become healthy without manual database commands

### Requirement: Repeatable persistent startup

Compose SHALL preserve application data and avoid duplicate seed records across restarts, including when no LLM key is configured.

#### Scenario: Second startup

- **WHEN** the stack is stopped and started again against its existing volume without provider credentials
- **THEN** services become healthy, prior data remains, and seed relationships are not duplicated
