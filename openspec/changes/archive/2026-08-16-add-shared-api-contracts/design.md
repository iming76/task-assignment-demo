## Context

Canonical domain types exist, but transport operations require optional-input and recursive-draft semantics. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Stable root-exported DTOs and error contracts shared by both applications.

**Non-Goals:**

- Runtime validation implementation or endpoint handlers.

## Decisions

1. Model create and patch inputs separately so required and optional fields remain accurate. A single partial Task input was rejected because it loses creation and omission semantics.
2. Use a recursive AgentTaskDraft and a closed public error-code union. Application-local interfaces were rejected because they create drift.

## Risks / Trade-offs

- [Recursive types do not validate runtime input] → OpenAPI/runtime schemas remain authoritative while these declarations provide compile-time ownership.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
