import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { SearchFilters } from "@dester/api-client";

export const useSearch = (filters: SearchFilters, enabled = true) => {
  return useQuery({
    queryKey: ["search", filters],
    queryFn: () => apiClient.search.search(filters),
    enabled: enabled && !!filters.q && filters.q.length > 0,
  });
};
