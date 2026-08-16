## Purpose

This capability defines the externally verifiable behavior for shared api contracts so downstream changes can rely on a stable boundary.

## ADDED Requirements

### Requirement: Canonical transport contracts

The shared package SHALL export request, response, recursive agent-draft, and public error types used by both applications.

#### Scenario: Consumer uses an API payload

- **WHEN** a backend or frontend consumer imports a public transport type
- **THEN** the type resolves from @repo/shared-types without local redeclaration

### Requirement: Task skill omission semantics

The create-task contract MUST distinguish an omitted requiredSkillIds property from an explicitly supplied empty array.

#### Scenario: Payloads are type checked

- **WHEN** one create payload omits requiredSkillIds and another supplies an empty array
- **THEN** both are valid and remain distinguishable at the service boundary
