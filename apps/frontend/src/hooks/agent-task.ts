import type {
  AgentTaskApplyRequest,
  AgentTaskProposalRequest,
} from "@repo/shared-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../api";
import { tasksQueryKey } from "./tasks";

export function useProposeAgentTask() {
  return useMutation({
    mutationFn: (input: AgentTaskProposalRequest) =>
      apiClient.agentTask.propose(input),
  });
}

export function useApplyAgentTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AgentTaskApplyRequest) =>
      apiClient.agentTask.apply(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });
}
