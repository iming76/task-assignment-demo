import type { AgentTaskRequest } from "@repo/shared-types";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../api";
import { tasksQueryKey } from "./tasks";

export function useOrchestrateAgentTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AgentTaskRequest) =>
      apiClient.agentTask.orchestrate(input),
    retry: false,
    onSuccess: (response) => {
      if (response.status === "created") {
        return queryClient.invalidateQueries({ queryKey: tasksQueryKey });
      }
    },
  });
}
