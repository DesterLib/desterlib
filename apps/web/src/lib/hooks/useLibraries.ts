import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

/**
 * Hook to fetch all libraries
 */
export function useLibraries() {
  return useQuery({
    queryKey: ["libraries"],
    queryFn: async () => {
      const response = await apiClient.collections.getLibraries();
      return response.collections;
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
      const response = await apiClient.collections.getById(id);
      return response.collection;
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
      // Delete the collection
      const response = await apiClient.collections.deleteCollection(libraryId);
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch libraries
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
      const response = await apiClient.settings.updateWithLibraries({
        libraries,
      });
      return response.settings;
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
      mediaType: string;
    }) => {
      // Cast to any since the scan endpoint expects a specific MediaType
      const response = await apiClient.scan.scan({
        path,
        mediaType: mediaType as "MOVIE" | "TV_SHOW" | "MUSIC" | "COMIC",
      });
      return response.scan;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["libraries"] });
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}
