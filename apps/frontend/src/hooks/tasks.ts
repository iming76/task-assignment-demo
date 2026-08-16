import { useQuery } from "@tanstack/react-query";

import { apiClient } from "../api";

export const tasksQueryKey = ["tasks"] as const;

export function useTasks() {
  return useQuery({
    queryKey: tasksQueryKey,
    queryFn: apiClient.tasks.list,
  });
}
