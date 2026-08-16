## Context

Task creation preserves omission semantics and the skill catalog is queryable; provider output is always untrusted. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Provider-independent inference with canonical resolution, timeout, observability, and non-blocking fallback.

**Non-Goals:**

- Manual inference endpoints, patch inference, or agent plan generation.

## Decisions

1. Inject a SkillInferenceService and keep the AI SDK adapter at infrastructure boundaries. Direct provider calls in handlers were rejected.
2. Request structured candidates constrained by the current catalog, validate at runtime, then resolve to current database IDs. Persisting free text was rejected.

## Risks / Trade-offs

- [Inference may be slow or unavailable] → enforce a timeout, log sanitized diagnostics, and commit an untagged task on every inference failure.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
