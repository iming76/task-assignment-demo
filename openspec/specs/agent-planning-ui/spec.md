# agent-planning-ui Specification

## Purpose

This capability defines the externally verifiable behavior for agent planning ui so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Review before persistence

The agent-task route MUST require explicit review and apply before a generated draft can create tasks.

#### Scenario: Proposal returned

- **WHEN** the backend returns a recursive proposal
- **THEN** the user can edit or discard it and no task mutation is sent until apply is confirmed

### Requirement: Unavailable planning isolation

The frontend SHALL present a useful planning-unavailable state without disabling core resource workflows.

#### Scenario: Planning unavailable

- **WHEN** the proposal request returns AGENT_UNAVAILABLE
- **THEN** the agent route explains the condition and other application routes remain usable
