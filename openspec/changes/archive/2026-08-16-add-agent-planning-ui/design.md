## Context

The agent API and task tree compositions are available; generation and apply remain separate server operations. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- An explicit editable review gate with discard, apply, and unavailable states.

**Non-Goals:**

- Browser-side provider access or automatic persistence after generation.

## Decisions

1. Keep proposal drafts in local UI state until explicit apply and treat discard as a local operation. Auto-apply was rejected.
2. Reuse task-tree-style recursive compositions but keep draft view models separate from persisted Task models. Calling an LLM from the browser was rejected.

## Risks / Trade-offs

- [Edited drafts may become stale] → show apply-time validation errors and retain the reviewed draft for correction.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
