## Purpose

This capability defines the externally verifiable behavior for database seeds so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Idempotent application seed

The normal seed command SHALL create the documented categories, described skills, and representative developers using stable identifiers without duplication.

#### Scenario: Seed runs twice

- **WHEN** the application seed command runs twice against the same migrated database
- **THEN** the second run leaves the same records and relationships as the first

### Requirement: Isolated test fixtures

Test fixture identifiers MUST be disjoint from application seed identifiers and MUST NOT be loaded by the normal seed command.

#### Scenario: Normal database is inspected

- **WHEN** the application seed completes in a non-test database
- **THEN** no test fixture identifier is present
