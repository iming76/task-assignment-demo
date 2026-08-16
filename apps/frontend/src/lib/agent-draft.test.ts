import { describe, expect, it } from "vitest";

import type { AgentTaskDraft } from "@repo/shared-types";
import { attachLocalIds, stripLocalIds, updateDraftNode } from "./agent-draft";

function draft(overrides: Partial<AgentTaskDraft> = {}): AgentTaskDraft {
  return {
    name: "Root",
    description: "Description.",
    assigneeId: null,
    requiredSkillIds: [],
    subtasks: [],
    ...overrides,
  };
}

describe("attachLocalIds / stripLocalIds", () => {
  it("round-trips a three-level draft tree without losing or altering data", () => {
    const original: AgentTaskDraft[] = [
      draft({
        name: "Root",
        subtasks: [
          draft({
            name: "Child",
            subtasks: [draft({ name: "Grandchild", assigneeId: "d1" })],
          }),
        ],
      }),
    ];

    const keyed = attachLocalIds(original);
    expect(stripLocalIds(keyed)).toEqual(original);
  });

  it("assigns a distinct localId to every node", () => {
    const keyed = attachLocalIds([
      draft({
        name: "A",
        subtasks: [draft({ name: "B" }), draft({ name: "C" })],
      }),
    ]);

    const ids = [
      keyed[0]!.localId,
      keyed[0]!.subtasks[0]!.localId,
      keyed[0]!.subtasks[1]!.localId,
    ];
    expect(new Set(ids).size).toBe(3);
  });
});

describe("updateDraftNode", () => {
  it("updates only the targeted node at any depth, leaving siblings untouched", () => {
    const keyed = attachLocalIds([
      draft({
        name: "Root",
        subtasks: [draft({ name: "Child" }), draft({ name: "Other child" })],
      }),
    ]);
    const targetId = keyed[0]!.subtasks[0]!.localId;

    const updated = updateDraftNode(keyed, targetId, { name: "Renamed" });

    expect(updated[0]!.subtasks[0]!.name).toBe("Renamed");
    expect(updated[0]!.subtasks[1]!.name).toBe("Other child");
    expect(updated[0]!.name).toBe("Root");
  });

  it("returns the tree unchanged when the localId is not found", () => {
    const keyed = attachLocalIds([draft({ name: "Root" })]);

    const updated = updateDraftNode(keyed, "missing", { name: "Nope" });

    expect(updated).toEqual(keyed);
  });
});
