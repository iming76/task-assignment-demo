import type { Task } from "@repo/shared-types";

export interface TaskTreeNode {
  task: Task;
  children: TaskTreeNode[];
}

export interface TaskTree {
  roots: TaskTreeNode[];
  /** Tasks unreachable from any root: a missing parent or a data cycle. */
  orphans: Task[];
}

/**
 * Derives a nested view model from the flat task list without mutating or
 * redefining the transport `Task` shape. Traversal starts only from actual
 * roots (parentTaskId === null) and marks each task visited once, so a
 * task can never appear twice and a cycle disconnected from any root simply
 * never gets visited — it surfaces in `orphans` instead of hanging the walk.
 */
export function buildTaskTree(tasks: Task[]): TaskTree {
  const childrenByParent = new Map<string, Task[]>();
  for (const task of tasks) {
    if (task.parentTaskId === null) continue;
    const siblings = childrenByParent.get(task.parentTaskId) ?? [];
    siblings.push(task);
    childrenByParent.set(task.parentTaskId, siblings);
  }

  const visited = new Set<string>();

  function buildNode(task: Task): TaskTreeNode {
    visited.add(task.id);
    const children = (childrenByParent.get(task.id) ?? [])
      .filter((child) => !visited.has(child.id))
      .map(buildNode);
    return { task, children };
  }

  const roots = tasks
    .filter((task) => task.parentTaskId === null)
    .map(buildNode);

  const orphans = tasks.filter((task) => !visited.has(task.id));

  return { roots, orphans };
}
