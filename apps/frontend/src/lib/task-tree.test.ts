import { describe, expect, it } from "vitest";

import type { Task } from "@repo/shared-types";
import { buildTaskTree } from "./task-tree";

function makeTask(overrides: Partial<Task> & { id: string }): Task {
  return {
    title: "Task",
    description: "Description.",
    status: "TODO",
    depth: 1,
    assigneeId: null,
    parentTaskId: null,
    requiredSkillIds: [],
    ...overrides,
  };
}

describe("buildTaskTree", () => {
  it("builds a three-level hierarchy under its root", () => {
    const root = makeTask({ id: "root", depth: 1 });
    const child = makeTask({ id: "child", parentTaskId: "root", depth: 2 });
    const grandchild = makeTask({
      id: "grandchild",
      parentTaskId: "child",
      depth: 3,
    });

    const tree = buildTaskTree([root, child, grandchild]);

    expect(tree.roots).toHaveLength(1);
    expect(tree.roots[0]?.task.id).toBe("root");
    expect(tree.roots[0]?.children).toHaveLength(1);
    expect(tree.roots[0]?.children[0]?.task.id).toBe("child");
    expect(tree.roots[0]?.children[0]?.children[0]?.task.id).toBe("grandchild");
    expect(tree.orphans).toHaveLength(0);
  });

  it("supports multiple independent roots", () => {
    const rootA = makeTask({ id: "a" });
    const rootB = makeTask({ id: "b" });

    const tree = buildTaskTree([rootA, rootB]);

    expect(tree.roots.map((node) => node.task.id).sort()).toEqual(["a", "b"]);
  });

  it("surfaces a task whose parent is missing from the list as an orphan", () => {
    const orphan = makeTask({ id: "lost", parentTaskId: "missing-parent" });

    const tree = buildTaskTree([orphan]);

    expect(tree.roots).toHaveLength(0);
    expect(tree.orphans.map((task) => task.id)).toEqual(["lost"]);
  });

  it("isolates a cycle disconnected from any root as orphans instead of recursing forever", () => {
    const a = makeTask({ id: "a", parentTaskId: "b" });
    const b = makeTask({ id: "b", parentTaskId: "a" });

    const tree = buildTaskTree([a, b]);

    expect(tree.roots).toHaveLength(0);
    expect(tree.orphans.map((task) => task.id).sort()).toEqual(["a", "b"]);
  });

  it("never drops or duplicates a task across roots, children, and orphans", () => {
    const root = makeTask({ id: "root" });
    const child = makeTask({ id: "child", parentTaskId: "root" });
    const orphan = makeTask({ id: "orphan", parentTaskId: "ghost" });
    const tasks = [root, child, orphan];

    const tree = buildTaskTree(tasks);

    const seen = new Set<string>();
    function collect(nodes: typeof tree.roots) {
      for (const node of nodes) {
        expect(seen.has(node.task.id)).toBe(false);
        seen.add(node.task.id);
        collect(node.children);
      }
    }
    collect(tree.roots);
    for (const orphanTask of tree.orphans) {
      expect(seen.has(orphanTask.id)).toBe(false);
      seen.add(orphanTask.id);
    }

    expect(seen).toEqual(new Set(tasks.map((task) => task.id)));
  });
});
