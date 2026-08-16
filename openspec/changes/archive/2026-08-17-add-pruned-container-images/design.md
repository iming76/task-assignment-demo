## Context

Production application builds exist across a pnpm/Turborepo monorepo and must be packaged without development bulk. See proposal.md for motivation and the capability spec for observable behavior.

## Goals / Non-Goals

**Goals:**

- Two reproducible multi-stage images with narrow runtime contents and health contracts.

**Non-Goals:**

- Compose orchestration or cloud deployment.

## Decisions

1. Use turbo prune --docker and a frozen install in separate dependency/build stages. Copying the full workspace into final images was rejected.
2. Serve frontend dist through nginx with SPA fallback; run the backend as a non-root Node process with initialization separate from serving.

## Risks / Trade-offs

- [Pruning can omit undeclared dependencies] → require accurate workspace manifests and verify builds from a clean context.

## Migration Plan

Implement behind the existing workspace boundaries, run the change-specific checks, and keep rollback limited to the files and migrations owned by this change. Any irreversible database transition MUST provide a tested rollback or documented forward-fix before release.
