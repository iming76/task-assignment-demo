import { useQuery } from "@tanstack/react-query";

import { apiClient } from "../api";

export const categoriesQueryKey = ["categories"] as const;

export function useCategories() {
  return useQuery({
    queryKey: categoriesQueryKey,
    queryFn: apiClient.categories.list,
  });
}
