import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApiV1CollectionsLibraries,
  getApiV1CollectionsSlugOrId,
  deleteApiV1CollectionsId,
  patchApiV1Settings,
  postApiV1Scan,
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
      return response.data.data?.collections ?? [];
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
      if (response.status === 200) {
        return response.data ?? null;
      }
      return null;
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
      await deleteApiV1CollectionsId(libraryId);
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
      const response = await patchApiV1Settings({
        libraries: libraries.map((lib) => ({
          ...lib,
          type: lib.type as MediaType,
        })),
      });
      return response.data.data?.settings ?? null;
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
      updateExisting = true,
    }: {
      path: string;
      mediaType: MediaType;
      updateExisting?: boolean;
    }) => {
      const response = await postApiV1Scan({ path, mediaType, updateExisting });
      if (response.status === 200) {
        return response.data.data?.scan ?? null;
      }
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["libraries"] });
      queryClient.invalidateQueries({ queryKey: ["media"] });
    },
  });
}
