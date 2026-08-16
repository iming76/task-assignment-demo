## Purpose

This capability defines the externally verifiable behavior for backend api foundation so downstream changes can rely on a stable boundary.

## ADDED Requirements

### Requirement: Contract-first request handling

The backend SHALL derive routing and runtime validation from the machine-readable OpenAPI contract and shared public DTOs.

#### Scenario: Invalid request reaches server

- **WHEN** a request violates an OpenAPI request schema
- **THEN** the server rejects it through the documented public error envelope before application behavior runs

### Requirement: Internal error isolation

The backend MUST NOT expose stack traces, raw database errors, or provider details in public responses.

#### Scenario: Internal dependency fails

- **WHEN** an injected dependency throws an unexpected internal error
- **THEN** the response uses the documented INTERNAL_ERROR shape without internal details
