## 1. Contract-first server

- [x] 1.1 Add Fastify and backend application test tooling
- [x] 1.2 Author per-resource request/response JSON Schemas directly in each `src/routes/<resource>/schema.ts`
- [x] 1.3 Implement production/test bootstraps with injected dependencies

## 2. Boundaries and errors

- [x] 2.1 Create handler, application-service, repository, and transaction interfaces
- [x] 2.2 Import public DTOs from @repo/shared-types at boundaries
- [x] 2.3 Implement one mapper for documented application errors and unexpected failures
- [x] 2.4 Test boot, runtime validation, and absence of internal details in responses
