# shared-domain-types Specification

## Purpose

This capability defines the externally verifiable behavior for shared domain types so downstream changes can rely on a stable boundary.

## Requirements

### Requirement: Canonical domain imports

The shared package SHALL export TaskStatus, Task, Developer, Category, and Skill as the canonical public domain types.

#### Scenario: External package import

- **WHEN** a workspace consumer imports the domain models from @repo/shared-types
- **THEN** the import resolves without reaching into the package source directory

### Requirement: Framework independence

The shared domain package MUST remain independent of application frameworks, database clients, and LLM providers.

#### Scenario: Package dependency inspection

- **WHEN** the shared package manifest and public declarations are inspected
- **THEN** they contain no Fastify, React, Prisma, or provider-specific dependency
