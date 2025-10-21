import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosClient } from "@/lib/axios";
import type {
  LibraryListResponse,
  LibraryUpdateRequest,
  LibraryUpdateResponse,
  LibraryDeleteResponse,
  LibraryCreateRequest,
  ScanPathRequest,
  ScanPathResponse,
} from "@/types/api";

export const useLibraries = (filters?: {
  isLibrary?: boolean;
  libraryType?: string;
}) => {
  return useQuery<LibraryListResponse>({
    queryKey: ["libraries", filters],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filters?.isLibrary !== undefined) {
          params.append("isLibrary", filters.isLibrary.toString());
        }
        if (filters?.libraryType) {
          params.append("libraryType", filters.libraryType);
        }

        const response = await axiosClient.get<LibraryListResponse>(
          `/api/v1/library?${params.toString()}`
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching libraries:", error);
        // Return empty array as fallback to prevent component crashes
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

export const useUpdateLibrary = () => {
  const queryClient = useQueryClient();

  return useMutation<LibraryUpdateResponse, Error, LibraryUpdateRequest>({
    mutationFn: async (libraryData) => {
      const response = await axiosClient.put<LibraryUpdateResponse>(
        "/api/v1/library",
        libraryData
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch libraries
      queryClient.invalidateQueries({ queryKey: ["libraries"] });
    },
  });
};

export const useDeleteLibrary = () => {
  const queryClient = useQueryClient();

  return useMutation<LibraryDeleteResponse, Error, { id: string }>({
    mutationFn: async ({ id }) => {
      const response = await axiosClient.delete<LibraryDeleteResponse>(
        "/api/v1/library",
        {
          data: { id },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch libraries
      queryClient.invalidateQueries({ queryKey: ["libraries"] });
    },
  });
};

export const useCreateLibrary = () => {
  const queryClient = useQueryClient();

  return useMutation<ScanPathResponse, Error, LibraryCreateRequest>({
    mutationFn: async (libraryData) => {
      if (!libraryData.libraryPath) {
        throw new Error(
          "Library path is required to create and scan a library"
        );
      }

      const scanData: ScanPathRequest = {
        path: libraryData.libraryPath,
        options: {
          libraryName: libraryData.name,
          mediaType: libraryData.libraryType === "TV_SHOW" ? "tv" : "movie",
        },
      };

      const response = await axiosClient.post<ScanPathResponse>(
        "/api/v1/scan/path",
        scanData
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch libraries to get the newly created library
      queryClient.invalidateQueries({ queryKey: ["libraries"] });
    },
  });
};
