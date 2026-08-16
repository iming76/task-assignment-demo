# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable

# Compute the pruned monorepo subset needed to build and run the backend.
FROM base AS pruner
COPY . .
RUN npx turbo prune backend --docker

# Install all workspace dependencies (including dev) and build the backend.
# This stage also has the Prisma CLI available, since it is only a
# devDependency of the backend package.
FROM base AS installer
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

# `prisma generate` needs a resolvable DATABASE_URL but never connects to it.
ENV DATABASE_URL="postgresql://user:password@localhost:5432/db?schema=public"
RUN pnpm --filter=backend run db:generate
RUN pnpm turbo run build --filter=backend

# Runs schema migrations and seed data separately from the server process,
# ahead of starting the runner container, using the full installer toolchain
# (the Prisma CLI is a devDependency and is not shipped in the runner image).
FROM installer AS migrator
WORKDIR /app/apps/backend
ENTRYPOINT ["pnpm", "run", "db:deploy"]

# Minimal, non-root production runtime that only serves the API. It carries
# no Prisma CLI; run the migrator stage against the target database first.
FROM base AS runner
RUN addgroup -S backend && adduser -S backend -G backend && chown backend:backend /app
USER backend

COPY --from=pruner --chown=backend:backend /app/out/json/ .
COPY --from=pruner --chown=backend:backend /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile --prod

COPY --from=installer --chown=backend:backend /app/apps/backend/dist ./apps/backend/dist
COPY --from=installer --chown=backend:backend /app/packages/shared-types/dist ./packages/shared-types/dist

WORKDIR /app/apps/backend
ENV NODE_ENV=production
EXPOSE 3100

HEALTHCHECK --interval=10s --timeout=5s --start-period=15s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3100)+'/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

CMD ["node", "dist/src/server.js"]
