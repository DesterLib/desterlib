import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApiV1CollectionsLibraries,
  getApiV1CollectionsSlugOrId,
  deleteApiV1CollectionsId,
  patchApiSettings,
  postApiScan,
  type MediaType,
} from "@dester/api-client";
import "@/lib/api-client"; // Import to ensure client is configured

/**
 * Hook to fetch all libraries
 */
export function useLibraries() {
  return useQuery({
    queryKey: ["libraries"],
    queryFn: async () => {
      const response = await getApiV1CollectionsLibraries();
      return response.data;
    },
  });
}

/**
 * Hook to fetch a single library by ID
 */
export function useLibrary(id: string) {
  return useQuery({
    queryKey: ["library", id],
    queryFn: async () => {
      const response = await getApiV1CollectionsSlugOrId(id);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Hook to delete a library
 */
export function useDeleteLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (libraryId: string) => {
      const response = await deleteApiV1CollectionsId(libraryId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["libraries"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

/**
 * Hook to update libraries via settings
 * This updates all libraries at once through the settings endpoint
 */
export function useUpdateLibraries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      libraries: Array<{ name: string; type: string; path: string }>
    ) => {
      const response = await patchApiSettings({ libraries });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["libraries"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

/**
 * Hook to scan a library
 */
export function useScanLibrary() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      path,
      mediaType,
    }: {
      path: string;
      mediaType: MediaType;
    }) => {
      const response = await postApiScan({ path, mediaType });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["libraries"] });
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}
