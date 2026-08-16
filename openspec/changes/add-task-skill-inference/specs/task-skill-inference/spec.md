## Purpose

This capability defines the externally verifiable behavior for task skill inference so downstream changes can rely on a stable boundary.

## ADDED Requirements

### Requirement: Omission-only inference

Task creation SHALL invoke skill inference exactly when requiredSkillIds is omitted and SHALL skip inference whenever the field is present.

#### Scenario: Creation payload varies

- **WHEN** one request omits requiredSkillIds and another explicitly supplies an empty array
- **THEN** only the omitted request invokes the inference service

### Requirement: Safe inference fallback

The system MUST persist only canonical current skill identifiers and SHALL create an untagged task when inference is unavailable, malformed, empty, unknown, or timed out.

#### Scenario: Inference fails

- **WHEN** an omitted-skills task encounters any inference failure
- **THEN** task creation succeeds with an empty requiredSkillIds array and no untrusted value is stored
