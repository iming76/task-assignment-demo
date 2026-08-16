## Context

The frontend shell and shared API contracts exist, but features need consistent HTTP behavior. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- A small typed client with environment configuration, omission-safe JSON, and structured errors.

**Non-Goals:**

- Caching strategy or UI state management.

## Decisions

1. Centralize URL construction, JSON handling, and public error parsing behind feature-oriented methods. Direct fetch calls in components were rejected.
2. Construct request bodies intentionally so omitted properties stay absent rather than becoming explicit empty values. Generic object normalization was rejected due to inference semantics.

## Risks / Trade-offs

- [Backend may be unreachable] → normalize network failures into safe UI errors while preserving documented server codes when present.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
