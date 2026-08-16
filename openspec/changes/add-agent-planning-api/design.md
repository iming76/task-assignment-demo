## Context

Task and resource services expose current catalogs and transactional creation, while shared recursive DTOs define the boundary. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Write-free generation and deterministic, atomic reviewed-draft apply.

**Non-Goals:**

- Browser review UX or per-task skill inference.

## Decisions

1. Separate TaskPlanningService generation from deterministic apply. Reusing one provider-driven method for both was rejected because apply must work without an LLM key.
2. Validate structured recursive output and current IDs, clearing ineligible generated assignees; apply revalidates edited input and flattens it inside one transaction.

## Risks / Trade-offs

- [Deep or oversized plans can exhaust resources] → enforce request/output limits and use safe traversal without imposing a one-level product limit.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
