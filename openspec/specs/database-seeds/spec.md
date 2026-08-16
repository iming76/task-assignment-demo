## Purpose

This capability defines the boundary for initial application data and
deterministic database data used by automated tests.

## Requirements

### Requirement: Idempotent test seed

The test seed SHALL create representative categories, skills, and developers
using stable identifiers without duplication, and SHALL refuse to run outside a
test environment.

#### Scenario: Seed runs twice

- **WHEN** the test seed runs twice against the same migrated test database
- **THEN** the second run leaves the same records and relationships as the first

### Requirement: Automatic application seed

The backend SHALL create the default categories, skills, developers, and
developer-skill relationships when it starts with an empty database.

#### Scenario: Backend starts with an empty database

- **WHEN** the backend starts and no category, skill, developer, or task data exists
- **THEN** the default application data is created before the server accepts requests

#### Scenario: Backend starts with existing data

- **WHEN** the backend starts and any category, skill, developer, or task data exists
- **THEN** automatic application seeding is skipped and existing data is unchanged

### Requirement: Isolated test fixtures

Test fixture identifiers MUST be disjoint from the shared test seed identifiers.

#### Scenario: Test data isolation

- **WHEN** the application seed runs
- **THEN** no test seed or focused fixture identifier is loaded
