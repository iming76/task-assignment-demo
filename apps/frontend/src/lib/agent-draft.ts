import type { AgentTaskDraft } from "@repo/shared-types";

/**
 * `AgentTaskDraft` has no id — it's a plain recursive shape shared with the
 * server. The review UI needs stable per-node identity for React keys and
 * targeted edits, so this wraps each node with a client-only `localId` that
 * never leaves the browser. `stripLocalIds` restores the plain shape the
 * apply endpoint expects.
 */
export interface KeyedDraft {
  localId: string;
  name: string;
  description: string;
  assigneeId: string | null;
  requiredSkillIds: string[];
  subtasks: KeyedDraft[];
}

let counter = 0;
function nextLocalId(): string {
  counter += 1;
  return `draft-${counter}`;
}

export function attachLocalIds(drafts: AgentTaskDraft[]): KeyedDraft[] {
  return drafts.map((draft) => ({
    localId: nextLocalId(),
    name: draft.name,
    description: draft.description,
    assigneeId: draft.assigneeId ?? null,
    requiredSkillIds: draft.requiredSkillIds,
    subtasks: attachLocalIds(draft.subtasks),
  }));
}

export function stripLocalIds(drafts: KeyedDraft[]): AgentTaskDraft[] {
  return drafts.map((draft) => ({
    name: draft.name,
    description: draft.description,
    assigneeId: draft.assigneeId,
    requiredSkillIds: draft.requiredSkillIds,
    subtasks: stripLocalIds(draft.subtasks),
  }));
}

export type DraftFieldPatch = Partial<
  Pick<KeyedDraft, "name" | "description" | "assigneeId" | "requiredSkillIds">
>;

export function updateDraftNode(
  drafts: KeyedDraft[],
  localId: string,
  patch: DraftFieldPatch,
): KeyedDraft[] {
  return drafts.map((draft) => {
    if (draft.localId === localId) {
      return { ...draft, ...patch };
    }
    if (draft.subtasks.length === 0) {
      return draft;
    }
    return {
      ...draft,
      subtasks: updateDraftNode(draft.subtasks, localId, patch),
    };
  });
}
