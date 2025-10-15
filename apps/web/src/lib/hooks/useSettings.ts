import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApiV1Settings,
  patchApiV1Settings,
  type PatchApiV1SettingsBody,
} from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

/**
 * Hook to fetch settings
 */
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await getApiV1Settings();
      return response.data.data?.settings ?? null;
    },
  });
}

/**
 * Hook to update settings
 */
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: PatchApiV1SettingsBody) => {
      const response = await patchApiV1Settings(settings);
      return response.data.data?.settings ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
