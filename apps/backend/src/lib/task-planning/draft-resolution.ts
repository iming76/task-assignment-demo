import type { AgentTaskDraft, Developer, Skill } from "@repo/shared-types";
import type { ShapedDraftNode } from "./draft-shape.js";

/**
 * Resolves a shaped draft tree's skill and assignee references against the
 * current catalog. Propose and apply share this walk but diverge on how to
 * react to an unresolvable reference: propose degrades (unknown skill fails
 * the whole draft, ineligible assignee is cleared) while apply rejects the
 * request outright so a reviewed submission is never silently altered.
 */
export interface DraftResolutionPolicy {
  onUnknownSkill(skillId: string): never;
  /** Called when assigneeId is set but the developer is unknown or does not cover requiredSkillIds. */
  onIneligibleAssignee(
    assigneeId: string,
    developer: Developer | undefined,
  ): string | null;
}

export function resolveDraftTree(
  nodes: ShapedDraftNode[],
  skillsById: Map<string, Skill>,
  developersById: Map<string, Developer>,
  policy: DraftResolutionPolicy,
): AgentTaskDraft[] {
  return nodes.map((node) => {
    const requiredSkillIds = [...new Set(node.requiredSkillIds)];
    for (const skillId of requiredSkillIds) {
      if (!skillsById.has(skillId)) {
        policy.onUnknownSkill(skillId);
      }
    }

    let assigneeId = node.assigneeId;
    if (assigneeId !== null) {
      const developer = developersById.get(assigneeId);
      const eligible =
        developer !== undefined &&
        requiredSkillIds.every((id) => developer.skillIds.includes(id));
      if (!eligible) {
        assigneeId = policy.onIneligibleAssignee(assigneeId, developer);
      }
    }

    return {
      name: node.name,
      description: node.description,
      assigneeId,
      requiredSkillIds,
      subtasks: resolveDraftTree(
        node.subtasks,
        skillsById,
        developersById,
        policy,
      ),
    };
  });
}
