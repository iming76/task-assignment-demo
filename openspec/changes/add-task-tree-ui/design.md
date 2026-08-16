## Context

The API returns flat tasks and typed mutation methods are available; recursive status controls are a later slice. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Cycle-safe task tree presentation and core task/assignment/skill/deletion workflows.

**Non-Goals:**

- Status conflict UI or agent-draft editing.

## Decisions

1. Build an internal adjacency map/view model from shared Task values and render one recursive node component. Redefining the transport Task as nested was rejected.
2. Filter assignee choices for guidance but submit all mutations to the authoritative server. Client-only authorization was rejected.

## Risks / Trade-offs

- [Malformed parent data could hide nodes or recurse forever] → track visited IDs and render orphans in a visible recovery section.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
