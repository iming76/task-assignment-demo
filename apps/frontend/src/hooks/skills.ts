import type { CreateSkillInput } from "@repo/shared-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "../api";

export const skillsQueryKey = ["skills"] as const;

export function useSkills() {
  return useQuery({
    queryKey: skillsQueryKey,
    queryFn: apiClient.skills.list,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSkillInput) => apiClient.skills.create(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: skillsQueryKey }),
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.skills.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: skillsQueryKey }),
  });
}
