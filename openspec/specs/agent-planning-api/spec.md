# agent-planning-api Specification

## Purpose

This capability defines the externally verifiable behavior for agent planning api so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Single conversational orchestration endpoint

The API SHALL accept a natural-language agent-task conversation through `POST /agent-task` and SHALL return exactly one typed outcome: a clarification request or a created task tree.

#### Scenario: Planning requires more information

- **WHEN** the submitted conversation lacks information required to form a valid task plan
- **THEN** the API returns a `needs_clarification` outcome containing one actionable question and creates no task records

#### Scenario: Planning has sufficient information

- **WHEN** the submitted conversation contains enough information to form a valid task plan
- **THEN** the API creates the plan and returns a `created` outcome containing the persisted tasks and any staffing gaps

### Requirement: Canonical skill-catalog discovery

Before selecting required skills, the planning agent MUST load the current skill catalog through the read-only skill-list tool, including canonical identifiers, names, and descriptions, and generated plans MUST reference only identifiers from that list.

#### Scenario: Relevant stored skills exist

- **WHEN** the agent plans work that may require stored skills
- **THEN** it lists the complete catalog and selects applicable canonical identifiers after considering skill names and descriptions

#### Scenario: Generated output contains an unlisted or stale skill

- **WHEN** a generated plan contains a skill identifier that was not returned by the request's skill list or no longer exists
- **THEN** the backend rejects the plan without persisting any part of its task tree

### Requirement: Deterministic qualified assignment

The backend MUST assign each planned task only to a current developer whose canonical skills cover every required skill, and SHALL rank otherwise eligible developers by the fewest assigned non-completed tasks with a stable identifier tie-break.

#### Scenario: Multiple developers cover the requirements

- **WHEN** more than one developer has every required skill
- **THEN** the task is assigned to the developer with the lowest active-task count, using stable identifier order to break a tie

#### Scenario: No developer covers the requirements

- **WHEN** no current developer has every required skill for a valid task or subtask
- **THEN** that node is created with `assigneeId: null` and other valid nodes continue to be created

### Requirement: Transactional autonomous creation with staffing gaps

The API MUST validate the complete generated hierarchy and atomically create all roots and descendants, and a successful response SHALL describe every unassigned node as a structured staffing gap containing its task identity, required skill identifiers, and a non-empty human-readable required role.

#### Scenario: Unassigned AI work is created

- **WHEN** a valid subtask requires canonical AI skills but no developer covers all of them
- **THEN** the complete tree is committed, the subtask remains unassigned, and the response reports a required role such as `AI Engineer`

#### Scenario: Validation or persistence fails

- **WHEN** any generated node is invalid or any write fails during creation
- **THEN** the transaction rolls back every root and descendant created by the request

### Requirement: Safe planning failure

The endpoint SHALL expose planning configuration, timeout, provider, malformed-output, and exhausted tool-loop failures through the documented `AGENT_UNAVAILABLE` response without retaining partial writes.

#### Scenario: Agent orchestration is unavailable

- **WHEN** the configured provider cannot produce a valid clarification or creation decision
- **THEN** the API returns `AGENT_UNAVAILABLE` and the task store remains unchanged
