import type { CreateTaskInput, PatchTaskInput } from "@repo/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../api";

export const tasksQueryKey = ["tasks"] as const;

export function useTasks() {
  return useQuery({
    queryKey: tasksQueryKey,
    queryFn: apiClient.tasks.list,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => apiClient.tasks.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });
}

export function usePatchTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PatchTaskInput }) =>
      apiClient.tasks.patch(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.tasks.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tasksQueryKey }),
  });
}
