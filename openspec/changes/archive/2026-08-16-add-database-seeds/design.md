## Context

The migrated schema needs stable representative data for local use and isolated IDs for automated tests. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Idempotent application seeds and guarded test fixtures with provably disjoint IDs.

**Non-Goals:**

- Schema changes or HTTP test orchestration.

## Decisions

1. Keep application seed IDs and test fixture IDs in separate modules and assert disjointness. Random IDs were rejected because repeatability and stable references are required.
2. Use upserts or equivalent idempotent writes for records and joins. Destructive truncate-and-reload seeding was rejected because Compose must preserve user data.

## Risks / Trade-offs

- [A fixture command could target production] → require an explicit test-database guard before any fixture write.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
