## 1. Compose services

- [x] 1.1 Add db, backend, and frontend services with health checks and dependency conditions
- [x] 1.2 Add a persistent PostgreSQL volume and expose only required ports
- [x] 1.3 Pass database and optional provider settings through environment variables

## 2. Initialization and startup

- [x] 2.1 Wait for database health before committed migrations and idempotent application seeding
- [x] 2.2 Start the backend only after initialization and the frontend against a reachable backend origin

## 3. Repeatability checks

- [x] 3.1 Run docker compose up --build from a clean clone without host node_modules
- [x] 3.2 Verify all services become healthy with no LLM key
- [x] 3.3 Restart against the existing volume and verify data preservation without duplicate seeds
