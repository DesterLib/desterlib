import { useQuery } from "@tanstack/react-query";
import { getApiSearch, type GetApiSearchParams } from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

export const useSearch = (filters: GetApiSearchParams, enabled = true) => {
  return useQuery({
    queryKey: ["search", filters],
    queryFn: async () => {
      const response = await getApiSearch(filters);
      return response.data;
    },
    enabled: enabled && !!filters.q && filters.q.length > 0,
  });
};
