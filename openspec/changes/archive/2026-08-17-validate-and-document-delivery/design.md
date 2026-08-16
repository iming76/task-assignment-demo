## Context

All product and container slices are complete; the remaining risk is an unverified or misleading delivery. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- A clean-clone acceptance path and documentation aligned with the actual system.

**Non-Goals:**

- New product functionality or deployment automation.

## Decisions

1. Use documented automated quality commands plus representative API and browser smoke flows. A prose-only completion claim was rejected.
2. Make README the operational entry point and link deeper architecture, contract, and numbered task docs. Duplicating inconsistent commands across pages was rejected.

## Risks / Trade-offs

- [Environment-specific smoke checks can be flaky] → use deterministic seeds, mocked automated provider tests, and explicit optional-provider expectations.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
