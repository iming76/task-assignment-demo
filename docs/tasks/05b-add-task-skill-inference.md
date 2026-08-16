---
title: 05b — Add Task Skill Inference
sidebar_position: 15
---

# Add Task Skill Inference

OpenSpec change: `add-task-skill-inference`

## Dependency position

Starts after [Add Task Write API](./04b-add-task-write-api.md).

## Outcome

Infer required skills only when task creation omits `requiredSkillIds`, while always degrading safely to an untagged task.

## Scope

- [ ] Define an injectable provider-independent inference service and a configured Vercel AI SDK adapter.
- [ ] Supply the current categorized skill catalog, including descriptions, as controlled context.
- [ ] Trigger once for omission, skip explicit `[]` or non-empty lists, and never infer during patch.
- [ ] Parse structured output, resolve only canonical skills, deduplicate IDs, and reject all untrusted values.
- [ ] Apply a timeout and sanitized diagnostics; on any failure create with `requiredSkillIds: []`.
- [ ] Test all trigger, validation, timeout, failure, and fallback paths using fakes with no network calls.

## Acceptance checks

- [ ] Provider absence or failure never prevents task creation.
- [ ] No free text or unknown provider value reaches the database.

## Unlocks

Final full-stack validation; it does not block deterministic core UI work.
