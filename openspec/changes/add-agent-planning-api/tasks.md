## 1. Planning boundary

- [x] 1.1 Add proposal/apply OpenAPI operations using shared DTOs
- [x] 1.2 Define and inject TaskPlanningService with current skills and developers as controlled context
- [x] 1.3 Add runtime recursive validation, depth-safe traversal, limits, timeout, and sanitized logging

## 2. Proposal behavior

- [x] 2.1 Generate canonical reviewable drafts without writes
- [x] 2.2 Reject unknown IDs, clear ineligible generated assignees, and map provider failures to AGENT_UNAVAILABLE

## 3. Transactional apply

- [x] 3.1 Revalidate all edited IDs and assignments without invoking the provider
- [x] 3.2 Flatten and create all TODO roots and descendants in one transaction
- [x] 3.3 Return the deterministic flat Task array

## 4. Provider-free tests

- [x] 4.1 Cover valid multi-root three-level output, no eligible developer, and no-write generation
- [x] 4.2 Cover missing configuration, timeout, malformed output, and unknown IDs
- [x] 4.3 Cover edited apply, stale IDs, mismatch, forced write failure, and complete rollback
