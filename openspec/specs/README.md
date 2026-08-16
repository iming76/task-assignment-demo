# OpenSpec Specs

This directory contains the canonical, accepted capability specs for the
project. It starts with this index only: proposed behavior currently lives in
`../changes/*/specs/` and moves here when a change is synced or archived.

## Documentation relationship

Use the documentation site as supporting context when authoring and reviewing
specs:

- [Requirements](../../docs/requirements.md) describes product scope and the
  evaluation rubric.
- [Architecture](../../docs/architecture/overview.md) explains system
  boundaries and links to the frontend, backend, and data-model references.
- [Backend API contract](../../docs/contract/backend-api.md) describes the
  planned HTTP surface and error behavior.
- [Constitution](../../docs/constitution/architecture.md) links the persistent
  engineering, security, coding, and AI-agent constraints.
- [Task plan](../../docs/tasks/overview.md) defines the dependency order and
  maps numbered task documents to OpenSpec changes.

The responsibility split is:

| Location                              | Responsibility                                         |
| ------------------------------------- | ------------------------------------------------------ |
| `openspec/specs/<capability>/spec.md` | Accepted, testable behavior; normative source of truth |
| `openspec/changes/<change>/specs/`    | Proposed additions, modifications, and removals        |
| `docs/requirements.md`                | Product overview and evaluation scope                  |
| `docs/architecture/`                  | Design rationale and system structure                  |
| `docs/contract/`                      | Detailed protocol and API reference                    |
| `docs/constitution/`                  | Cross-cutting repository constraints                   |
| `docs/tasks/`                         | Change ordering and implementation guidance            |

If documentation conflicts with an accepted capability spec, record and resolve
the discrepancy through an OpenSpec change. Do not silently overwrite either
source.
