/**
 * Structural validation for recursive AgentTaskDraft-shaped input. Used for
 * both the raw (untrusted) provider output on propose and, as defense in
 * depth alongside Fastify's own schema validation, the client-submitted
 * draft on apply. Bounds depth and node count with an explicit counter
 * rather than relying on JS call-stack limits, so a malicious or malformed
 * payload fails cleanly instead of crashing the process.
 */
export interface DraftLimits {
  maxDepth: number;
  maxNodes: number;
}

export const DEFAULT_DRAFT_LIMITS: DraftLimits = {
  maxDepth: 5,
  maxNodes: 200,
};

export class DraftShapeError extends Error {}

export interface ShapedDraftNode {
  name: string;
  description: string;
  assigneeId: string | null;
  requiredSkillIds: string[];
  subtasks: ShapedDraftNode[];
}

export function validateDraftShape(
  value: unknown,
  limits: DraftLimits = DEFAULT_DRAFT_LIMITS,
): ShapedDraftNode[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new DraftShapeError("Draft must be a non-empty array of tasks.");
  }

  let nodeCount = 0;

  function visit(nodes: unknown, depth: number): ShapedDraftNode[] {
    if (!Array.isArray(nodes)) {
      throw new DraftShapeError("subtasks must be an array.");
    }
    if (depth > limits.maxDepth) {
      throw new DraftShapeError("Draft exceeds the maximum nesting depth.");
    }

    return nodes.map((raw) => {
      nodeCount += 1;
      if (nodeCount > limits.maxNodes) {
        throw new DraftShapeError("Draft exceeds the maximum number of tasks.");
      }
      if (typeof raw !== "object" || raw === null) {
        throw new DraftShapeError("Each task must be an object.");
      }

      const node = raw as Record<string, unknown>;
      if (typeof node.name !== "string" || node.name.trim().length === 0) {
        throw new DraftShapeError("Task name must be a non-empty string.");
      }
      if (
        typeof node.description !== "string" ||
        node.description.trim().length === 0
      ) {
        throw new DraftShapeError(
          "Task description must be a non-empty string.",
        );
      }
      if (
        node.assigneeId !== undefined &&
        node.assigneeId !== null &&
        typeof node.assigneeId !== "string"
      ) {
        throw new DraftShapeError("assigneeId must be a string or null.");
      }
      if (
        !Array.isArray(node.requiredSkillIds) ||
        node.requiredSkillIds.some((id) => typeof id !== "string")
      ) {
        throw new DraftShapeError(
          "requiredSkillIds must be an array of strings.",
        );
      }

      return {
        name: node.name,
        description: node.description,
        assigneeId: (node.assigneeId as string | null | undefined) ?? null,
        requiredSkillIds: node.requiredSkillIds as string[],
        subtasks: visit(node.subtasks ?? [], depth + 1),
      };
    });
  }

  return visit(value, 1);
}
