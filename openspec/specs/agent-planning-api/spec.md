# agent-planning-api Specification

## Purpose

This capability defines the externally verifiable behavior for agent planning api so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Write-free proposals

The proposal endpoint SHALL return a validated recursive draft without creating or updating task records.

#### Scenario: Valid plan generated

- **WHEN** the provider returns a valid multi-level plan
- **THEN** the API returns an editable canonical draft and the task store remains unchanged

### Requirement: Transactional reviewed apply

The apply endpoint MUST revalidate every submitted identifier and assignment and atomically create the complete reviewed tree without invoking the provider.

#### Scenario: Mid-apply failure occurs

- **WHEN** any validation or write fails while applying a reviewed draft
- **THEN** the transaction rolls back every root and descendant created by that request
