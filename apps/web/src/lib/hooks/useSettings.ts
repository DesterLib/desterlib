import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApiSettings,
  patchApiSettings,
  type PatchApiSettingsBody,
} from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

/**
 * Hook to fetch settings
 */
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await getApiSettings();
      return response.data;
    },
  });
}

/**
 * Hook to update settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: PatchApiSettingsBody) => {
      const response = await patchApiSettings(settings);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
