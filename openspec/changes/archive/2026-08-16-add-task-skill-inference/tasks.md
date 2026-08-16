## 1. Provider boundary

- [x] 1.1 Define and inject SkillInferenceService using current categorized skills as context
- [x] 1.2 Implement the configured Vercel AI SDK adapter and credential-free environment example
- [x] 1.3 Apply a bounded timeout and sanitized diagnostic logging

## 2. Trigger and validation

- [x] 2.1 Invoke inference only when requiredSkillIds is absent and never during patch
- [x] 2.2 Parse structured output, resolve current canonical IDs, and deduplicate
- [x] 2.3 Fall back to an empty skill set for configuration, provider, timeout, malformed, empty, or unknown output

## 3. Provider-free tests

- [x] 3.1 Test omission versus explicit empty/non-empty skill lists
- [x] 3.2 Test canonical mapping, deduplication, and independent child requests
- [x] 3.3 Test every failure fallback and supplied unknown-ID NOT_FOUND behavior with injected fakes
