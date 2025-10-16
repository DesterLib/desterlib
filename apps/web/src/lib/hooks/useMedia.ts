import { useQuery } from "@tanstack/react-query";
import { getApiV1Media, type GetApiV1MediaParams } from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

const emptyMediaData = {
  media: [],
  pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
};

export const useMedia = (filters?: GetApiV1MediaParams) => {
  return useQuery({
    queryKey: ["media", filters],
    queryFn: async () => {
      try {
        const response = await getApiV1Media(filters);
        if (response.status === 200) {
          return response.data.data ?? emptyMediaData;
        }
        return emptyMediaData;
      } catch (error) {
        // If offline, let React Query handle it with cached data
        if (error instanceof Error && !error.message.includes("fetch")) {
          console.error("Error fetching media:", error);
        }
        throw error;
      }
    },
    placeholderData: emptyMediaData,
  });
};

export const useMediaById = (id: string) => {
  return useQuery({
    queryKey: ["media", id],
    queryFn: async () => {
      try {
        const response = await getApiV1Media({ search: id });
        if (response.status === 200 && response.data.data?.media) {
          return response.data.data.media[0] ?? null;
        }
        return null;
      } catch (error) {
        if (error instanceof Error && !error.message.includes("fetch")) {
          console.error("Error fetching media:", error);
        }
        throw error;
      }
    },
    enabled: !!id,
    placeholderData: null,
  });
};
