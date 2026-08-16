## Purpose

This capability defines the externally verifiable behavior for resource write api so downstream changes can rely on a stable boundary.

## ADDED Requirements

### Requirement: Validated developer and skill mutations

The API SHALL create and update developers and skills transactionally with complete referenced-ID and uniqueness validation.

#### Scenario: Valid resource mutation

- **WHEN** a client submits a valid developer or skill mutation
- **THEN** the server commits the complete change and returns the public resource shape

### Requirement: Referenced resource deletion

The API MUST reject deletion of an assigned developer or a skill referenced by any developer or task.

#### Scenario: In-use deletion attempted

- **WHEN** a client deletes a resource that is still referenced
- **THEN** the server preserves the resource and returns IN_USE
