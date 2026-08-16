## Context

The current implementation has two Fastify writes at `POST /agent-task/proposals` and `POST /agent-task/apply`, recursive editable-draft DTOs, a provider that receives the complete skill/developer catalogs, and a frontend review/apply screen. The replacement crosses the backend, shared types, and frontend and intentionally reverses the review-before-persistence rule documented in `docs/constitution/architecture.md`, `docs/constitution/security.md`, `docs/requirements.md`, `docs/contract/backend-api.md`, and `docs/architecture/frontend.md`.

Skills already contain canonical `id`, `name`, and `description` fields. Developers contain canonical `skillIds` but no explicit capacity field, so availability must be derived from task workload without a data migration. LLM output remains untrusted, and task hierarchy creation must continue to use the existing transaction boundary and assignment invariants.

## Goals / Non-Goals

**Goals:**

- Keep one typed backend boundary for initial requests and clarification follow-ups.
- Load the complete current skill catalog, including names and descriptions, without a retrieval index or external search service.
- Prevent the model from inventing or persisting skill identifiers.
- Make assignment deterministic and workload-aware while preserving exact skill coverage.
- Commit a generated task tree once, atomically, and report unfilled roles without treating them as creation failures.
- Remove superseded code and tests after all consumers use the new contract.

**Non-Goals:**

- Persist conversation history or add a chat-session table; the client resubmits bounded conversation messages.
- Add embeddings, semantic vector storage, skill tags, developer capacity schedules, or a role catalog.
- Persist `requiredRole`; it is explanatory response metadata derived for staffing gaps.
- Preserve backward compatibility for the proposal/apply endpoints.
- Let an AI SDK tool write directly to Prisma or perform assignment independently of the service transaction.

## Decisions

### 1. Use a stateless conversation request and a discriminated response

The request is `{ messages: AgentTaskMessage[] }`, where messages have `role: "user" | "assistant"` and non-empty `content`. The first request contains one user message. A clarification follow-up resubmits the prior bounded messages, the returned assistant question, and the new user answer. Fastify limits message count and aggregate content size before invoking the provider.

`POST /agent-task` returns:

- `200` with `{ status: "needs_clarification", question }`; or
- `201` with `{ status: "created", message, tasks, staffingGaps }`.

`StaffingGap` contains `taskId`, `taskTitle`, `requiredRole`, `requiredSkillIds`, and optional `unmatchedSkillRequirements`. The response message summarizes the gaps for people; clients use the structured array.

This avoids server-side conversation storage while supporting more than one clarification round. A server-held `conversationId` was rejected because it adds lifecycle, expiry, storage, and authorization concerns unrelated to task creation.

### 2. Expose the complete skill list as the catalog-discovery agent tool

The orchestration provider receives a read-only `listSkills()` AI SDK tool. On every request, the backend loads the current assignment-sized skill catalog. The tool returns each skill's `id`, `name`, and `description`, giving the model enough context to match user requirements without a lexical retrieval layer.

The provider must call `listSkills` before returning a creation plan. The final structured decision may select only IDs from that complete list. The service rejects IDs outside the initially listed catalog or outside the catalog reloaded inside the write transaction.

Indexed lexical retrieval, embeddings, and external search services are excluded because the catalog is assignment-sized and can be supplied directly. A retrieval abstraction can be introduced later if catalog size makes complete-list prompts materially expensive or noisy.

### 3. Separate the agent decision from the mutating transaction

The AI SDK loop produces one validated decision:

- `{ action: "ask_clarification", question }`; or
- `{ action: "create_task_tree", tasks }`.

Each planned node contains `title`, `description`, `requiredSkillIds`, `requiredRole`, `unmatchedSkillRequirements`, and recursive `subtasks`. Unknown requirements are represented as explanatory strings, never fabricated skill IDs.

The model does not receive `createTask` or `assignTask` mutation tools. After the loop terminates, the service validates the whole decision and performs assignment and persistence. This prevents a later provider/tool-loop failure from returning an error after a database mutation and preserves a single atomic write boundary.

### 4. Resolve assignment inside the task-tree transaction

The transaction reloads canonical skills and developers, validates hierarchy bounds and every selected ID, and obtains each developer's count of assigned tasks whose status is not `DONE`. For each node:

1. Filter developers whose `skillIds` contain every `requiredSkillId`.
2. If `unmatchedSkillRequirements` is non-empty, treat the node as unassignable.
3. Otherwise sort eligible developers by active-task count ascending and stable developer ID ascending.
4. Select the first developer or use `assigneeId: null` when none exists.
5. Create the node depth-first with the parent ID and accumulate the flat response.

Workload counts are incremented in memory after each assignment so several nodes in one plan distribute predictably rather than all selecting the initially least-loaded developer. Database rules remain authoritative. A dedicated capacity/calendar model was rejected because none exists today and it would materially broaden the change.

### 5. Treat staffing gaps as successful creation metadata

Every unassignable valid node is created with `assigneeId: null`. The service records a `StaffingGap` after the task receives its database ID. `requiredRole` is bounded, non-empty display text from the validated plan (for example, `AI Engineer`); it does not grant permissions or affect eligibility. Eligibility depends only on canonical skill IDs and unmatched-requirement state.

This distinguishes a business outcome (work exists but staffing is missing) from an orchestration failure. A no-match result must not cause rollback; invalid plans and failed writes must.

### 6. Replace old modules instead of layering over proposal/apply

The `routes/agent-task` directory remains the transport home, but its route, schema, and handler contents are replaced with the single endpoint. The service is rewritten around `orchestrate`, and `lib/task-planning` is replaced by focused orchestration decision/schema/provider modules.

Once imports are migrated, remove obsolete recursive draft types and helpers, fake provider/tests, proposal/apply frontend hooks and local draft utilities, and obsolete live verification/judging code rather than retaining compatibility wrappers. Repository-wide reference searches and type checks are the deletion gate.

### 7. Update the frontend atomically with the breaking contract

The API client exposes one `agentTask.orchestrate` mutation. The page maintains the bounded conversation locally, renders clarification questions, and on creation renders persisted tasks plus staffing warnings. It removes editable draft/apply/discard state because those server operations no longer exist. Automatic mutation retries remain disabled to reduce duplicate autonomous creation until durable idempotency is introduced.

## Risks / Trade-offs

- [Immediate persistence removes human review and can create an incorrect but structurally valid plan] → Constrain tool results and structured output, validate everything server-side, display created results clearly, and retain normal task edit/delete workflows.
- [A growing catalog can make complete-list prompts expensive or noisy] → Keep catalog access behind the read-only tool boundary and introduce indexed retrieval only when measured catalog growth justifies it.
- [Model-selected role labels can be imprecise] → Treat labels as bounded explanatory metadata only; canonical skills remain the assignment authority.
- [Concurrent requests can choose the same least-loaded developer] → Compute within the write transaction and accept best-effort load ranking for this application; strict capacity reservation is outside scope.
- [A client retry after an uncertain network result can duplicate a created tree] → Disable automatic retries and document the limitation; durable idempotency is a follow-up capability.
- [Removing proposal/apply breaks existing clients] → Ship shared types, backend, frontend, tests, and documentation as one coordinated breaking change with no compatibility window.
- [Repository documentation currently prohibits autonomous persistence] → Update every identified normative and explanatory document in the same change and call out the policy reversal in review.

## Migration Plan

1. Introduce new shared orchestration types and backend internals behind tests while the old route remains temporarily compilable.
2. Replace the route registration and composition wiring with `POST /agent-task`.
3. Migrate the frontend client, hook, page, and tests to the new response union.
4. Remove the old endpoints, draft/provider utilities, verification code, and all now-unused exports/imports.
5. Update the API contract, architecture, security, requirements, and delivery documentation.
6. Run type checks, unit/integration tests, production builds, unused-reference searches, and a live-provider verification when credentials are available.

Rollback is a code rollback because this design adds no database columns or migrations. Tasks already created through the autonomous endpoint remain ordinary task records and are not deleted during rollback.
