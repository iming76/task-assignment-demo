# agent-planning-ui Specification

## Purpose

This capability defines the externally verifiable behavior for agent planning ui so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Conversational agent-task orchestration

The agent-task route SHALL submit the user's conversation to the single orchestration endpoint and SHALL present the returned clarification or created-task outcome without a separate draft review/apply step.

#### Scenario: Clarification returned

- **WHEN** the backend returns `needs_clarification`
- **THEN** the page displays the question, preserves the prior conversation, and lets the user submit a follow-up without showing a successful creation

#### Scenario: Task tree created

- **WHEN** the backend returns `created`
- **THEN** the page displays the persisted task tree and does not send a separate apply mutation

#### Scenario: Created tree contains staffing gaps

- **WHEN** a created outcome contains one or more unassigned staffing gaps
- **THEN** the page identifies each affected task and communicates its required role and skills without presenting creation as failed

### Requirement: Unavailable planning isolation

The frontend SHALL present a useful planning-unavailable state without disabling core resource workflows.

#### Scenario: Planning unavailable

- **WHEN** the proposal request returns AGENT_UNAVAILABLE
- **THEN** the agent route explains the condition and other application routes remain usable
