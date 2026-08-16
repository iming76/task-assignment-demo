## Purpose

This capability defines the externally verifiable behavior for frontend api client so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Typed API boundary

The frontend SHALL issue resource and agent requests through one client whose inputs and outputs use shared contracts.

#### Scenario: Feature calls an endpoint

- **WHEN** a frontend feature requests a supported backend operation
- **THEN** the client uses the documented method, URL, payload, and shared response type

### Requirement: Safe public errors

The frontend client SHALL convert network failures and documented error envelopes into user-safe structured errors.

#### Scenario: Backend rejects a request

- **WHEN** the server returns a documented non-success response
- **THEN** the client preserves the public code and message without leaking transport internals
