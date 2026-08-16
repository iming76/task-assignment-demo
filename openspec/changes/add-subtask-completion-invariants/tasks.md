## 1. Hierarchy and invariants

- [ ] 1.1 Implement bounded ancestor and descendant repository queries with cycle detection
- [ ] 1.2 Reject DONE when any descendant is TODO
- [ ] 1.3 Reject reopening below a DONE ancestor and child creation below a DONE parent
- [ ] 1.4 Keep unchanged status patches idempotent

## 2. Concurrency and verification

- [ ] 2.1 Implement and document the transaction isolation or locking strategy
- [ ] 2.2 Test leaf-up completion, root-down reopening, and at least three levels
- [ ] 2.3 Add a concurrent-write test or repository-level proof
- [ ] 2.4 Run backend build, lint, type-check, and integration tests
