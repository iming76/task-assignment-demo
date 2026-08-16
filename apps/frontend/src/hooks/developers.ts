import type {
  CreateDeveloperInput,
  PatchDeveloperInput,
} from "@repo/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../api";

export const developersQueryKey = ["developers"] as const;

export function useDevelopers() {
  return useQuery({
    queryKey: developersQueryKey,
    queryFn: apiClient.developers.list,
  });
}

export function useCreateDeveloper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDeveloperInput) =>
      apiClient.developers.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: developersQueryKey }),
  });
}

export function usePatchDeveloper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PatchDeveloperInput }) =>
      apiClient.developers.patch(id, input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: developersQueryKey }),
  });
}

export function useDeleteDeveloper() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.developers.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: developersQueryKey }),
  });
}
