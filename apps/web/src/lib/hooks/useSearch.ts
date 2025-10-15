import { useQuery } from "@tanstack/react-query";
import { getApiV1Search, type GetApiV1SearchParams } from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

export const useSearch = (filters: GetApiV1SearchParams, enabled = true) => {
  return useQuery({
    queryKey: ["search", filters],
    queryFn: async () => {
      const response = await getApiV1Search(filters);
      if (response.status === 200) {
        return response.data.data ?? { media: [], collections: [], total: 0 };
      }
      return { media: [], collections: [], total: 0 };
    },
    enabled: enabled && !!filters.q && filters.q.length > 0,
  });
};
