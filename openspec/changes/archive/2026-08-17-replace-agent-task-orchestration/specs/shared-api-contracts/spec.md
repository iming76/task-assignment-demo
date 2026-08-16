## MODIFIED Requirements

### Requirement: Canonical transport contracts

The shared package SHALL export resource request and response types plus the agent-task conversation, clarification, created-task, and staffing-gap types used by both applications, and SHALL no longer export proposal/apply draft transport types.

#### Scenario: Consumer handles an agent-task outcome

- **WHEN** a backend or frontend consumer imports the agent-task request or response union
- **THEN** the type resolves from `@repo/shared-types` and discriminates clarification from created-task outcomes without local redeclaration

#### Scenario: Consumer references a removed draft contract

- **WHEN** a consumer still imports an agent proposal, apply, or recursive editable-draft transport type
- **THEN** type checking fails and directs the consumer to migrate to the orchestration contract
