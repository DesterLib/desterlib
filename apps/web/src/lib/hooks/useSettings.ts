import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Settings } from "@dester/api-client";

/**
 * Hook to fetch settings
 */
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await apiClient.settings.get();
      return response.settings;
    },
  });
}

/**
 * Hook to update settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      settings: Partial<
        Omit<Settings, "id" | "createdAt" | "updatedAt" | "libraries">
      >
    ) => {
      const response = await apiClient.settings.update(settings);
      return response.settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
