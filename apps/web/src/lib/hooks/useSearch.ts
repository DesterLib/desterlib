import { useQuery } from "@tanstack/react-query";
import { getApiV1Search, type GetApiV1SearchParams } from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

const emptySearchData = { media: [], collections: [], total: 0 };

export const useSearch = (filters: GetApiV1SearchParams, enabled = true) => {
  return useQuery({
    queryKey: ["search", filters],
    queryFn: async () => {
      try {
        const response = await getApiV1Search(filters);
        if (response.status === 200) {
          return response.data.data ?? emptySearchData;
        }
        return emptySearchData;
      } catch (error) {
        // If offline, let React Query handle it with cached data
        if (error instanceof Error && !error.message.includes("fetch")) {
          console.error("Error searching:", error);
        }
        throw error;
      }
    },
    enabled: enabled && !!filters.q && filters.q.length > 0,
    placeholderData: emptySearchData,
  });
};
