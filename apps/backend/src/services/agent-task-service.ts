import type {
  AgentTaskApplyRequest,
  AgentTaskApplyResponse,
  AgentTaskProposalRequest,
  AgentTaskProposalResponse,
} from "@repo/shared-types";

/**
 * `propose` calls the configured agent and returns an editable, unpersisted
 * draft. `apply` treats a reviewed draft as untrusted input: it re-resolves
 * every ID and rechecks assignment/hierarchy rules before writing the whole
 * tree in one transaction.
 */
export interface AgentTaskService {
  propose(input: AgentTaskProposalRequest): Promise<AgentTaskProposalResponse>;
  apply(input: AgentTaskApplyRequest): Promise<AgentTaskApplyResponse>;
}
