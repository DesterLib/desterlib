import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/axios";
import type {
  SettingsGetResponse,
  SettingsUpdateRequest,
  SettingsUpdateResponse,
  CompleteFirstRunResponse,
} from "@/types/api";

export const useSettings = () => {
  return useQuery<SettingsGetResponse["settings"]>({
    queryKey: ["settings"],
    queryFn: async () => {
      try {
        const response =
          await axiosClient.get<SettingsGetResponse>("/api/v1/settings");
        return response.data.settings;
      } catch (error) {
        console.error("Error fetching settings:", error);
        throw error;
      }
    },
    enabled: true,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation<SettingsUpdateResponse, Error, SettingsUpdateRequest>({
    mutationFn: async (settingsData) => {
      const response = await axiosClient.put<SettingsUpdateResponse>(
        "/api/v1/settings",
        settingsData
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch settings
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
};

export const useCompleteFirstRun = () => {
  const queryClient = useQueryClient();

  return useMutation<CompleteFirstRunResponse, Error, void>({
    mutationFn: async () => {
      const response = await axiosClient.post<CompleteFirstRunResponse>(
        "/api/v1/settings/first-run-complete"
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch settings to update firstRun status
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
};
