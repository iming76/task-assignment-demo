## Purpose

This capability defines the externally verifiable behavior for resource read api so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Deterministic resource reads

The API SHALL list tasks, developers, skills, and categories in their documented stable order and expose documented detail operations.

#### Scenario: Resource list requested

- **WHEN** a client requests a supported resource collection
- **THEN** the server returns the public flattened shapes in deterministic order

### Requirement: Missing resource handling

The API SHALL return NOT_FOUND in the consistent error envelope for an unknown detail identifier.

#### Scenario: Unknown detail requested

- **WHEN** a client requests a detail endpoint using a well-formed identifier that does not exist
- **THEN** the server responds with the documented NOT_FOUND status and body
