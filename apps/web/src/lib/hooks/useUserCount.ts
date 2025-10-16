import { useQuery } from "@tanstack/react-query";
import { getApiV1Users } from "@dester/api-client";
import "@/lib/api-client";

/**
 * Hook to check if there are any existing users
 * This helps determine if the next user will be the first (admin) user
 */
export function useUserCount() {
  return useQuery<number>({
    queryKey: ["users", "count"],
    queryFn: async () => {
      try {
        const response = await getApiV1Users();
        const apiData = response.data as unknown as {
          data: { pagination: { total: number } };
        };
        return apiData.data?.pagination?.total ?? 0;
      } catch {
        // If endpoint is not accessible (requires auth), assume users exist
        return 1;
      }
    },
    staleTime: 30000, // 30 seconds
  });
}
