# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable

# Compute the pruned monorepo subset needed to build the frontend.
FROM base AS pruner
COPY . .
RUN npx turbo prune frontend --docker

# Install workspace dependencies and build the static assets.
FROM base AS installer
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

# Baked into the client bundle at build time; override to point at the
# backend's reachable origin (e.g. a Compose service name) when building.
ARG VITE_API_BASE_URL=http://localhost:3100
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm turbo run build --filter=frontend

# Minimal, non-root static file server. No Node.js, monorepo source, caches,
# or Storybook tooling/output are present in this stage.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runner
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=installer /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -q -O- http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
