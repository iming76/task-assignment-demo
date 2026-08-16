## 1. Planning boundary

- [ ] 1.1 Add proposal/apply OpenAPI operations using shared DTOs
- [ ] 1.2 Define and inject TaskPlanningService with current skills and developers as controlled context
- [ ] 1.3 Add runtime recursive validation, depth-safe traversal, limits, timeout, and sanitized logging

## 2. Proposal behavior

- [ ] 2.1 Generate canonical reviewable drafts without writes
- [ ] 2.2 Reject unknown IDs, clear ineligible generated assignees, and map provider failures to AGENT_UNAVAILABLE

## 3. Transactional apply

- [ ] 3.1 Revalidate all edited IDs and assignments without invoking the provider
- [ ] 3.2 Flatten and create all TODO roots and descendants in one transaction
- [ ] 3.3 Return the deterministic flat Task array

## 4. Provider-free tests

- [ ] 4.1 Cover valid multi-root three-level output, no eligible developer, and no-write generation
- [ ] 4.2 Cover missing configuration, timeout, malformed output, and unknown IDs
- [ ] 4.3 Cover edited apply, stale IDs, mismatch, forced write failure, and complete rollback
