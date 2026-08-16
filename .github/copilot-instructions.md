## Write commit messages in this exact format:

```
type[scope]: subject
```

- `type` — one of: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`, `build`, `ci`, `revert`.
- For `revert` commits, use the format `revert[scope]: Revert "<original subject>"` and optionally add a body line referencing the reverted commit hash.
- `scope` — one of: `spec`, `backend`, `frontend`, `shared-types`, `infra`, `others`. Pick the area the change primarily affects.
- Use `others` only when the change genuinely does not touch `spec`, `backend`, `frontend`, `shared-types`, or `infra` (e.g. root-level config files, repo documentation).
- `subject` — a concise, imperative-mood summary of the change (e.g. "Add", not "Added" or "Adds"). No trailing period.

Use square brackets around the scope, not parentheses. The whole header line must stay under 100 characters.

Examples:

```
feat[frontend]: Add login form validation
fix[backend]: Correct off-by-one error in pagination
docs[spec]: Archive add-subtask-nesting change and sync specs
chore[infra]: Bump turbo to 2.11
```

If a change spans multiple areas, pick the scope of the primary/driving change rather than inventing a combined scope.
