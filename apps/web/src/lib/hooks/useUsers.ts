import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getApiV1Users,
  getApiV1UsersUserId,
  putApiV1UsersUserId,
  deleteApiV1UsersUserId,
  type GetApiV1UsersParams,
  type GetApiV1Users200,
  type GetApiV1UsersUserId200,
  type PutApiV1UsersUserIdBody,
  type DeleteApiV1UsersUserId200,
} from "@dester/api-client";
import "@/lib/api-client";

// ────────────────────────────────────────────────────────────────────────────
// User Management Hooks
// ────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all users with optional pagination
 */
export function useUsers(params?: GetApiV1UsersParams) {
  return useQuery<GetApiV1Users200>({
    queryKey: ["users", params],
    queryFn: async () => {
      const response = await getApiV1Users(params);
      // API returns { success, requestId, data: GetApiV1Users200 }
      // Custom fetcher wraps as { data: apiResponse, status, headers }
      const apiData = response.data as unknown as { data: GetApiV1Users200 };
      return (
        apiData.data ?? {
          users: [],
          pagination: { total: 0, limit: 50, offset: 0, hasMore: false },
        }
      );
    },
    retry: 1,
    staleTime: 30000, // Cache for 30 seconds
  });
}

/**
 * Fetch a single user by ID
 */
export function useUser(userId: string | undefined) {
  return useQuery<GetApiV1UsersUserId200 | null>({
    queryKey: ["users", userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await getApiV1UsersUserId(userId);
      const apiData = response.data as unknown as {
        data: GetApiV1UsersUserId200;
      };
      return apiData.data ?? null;
    },
    enabled: !!userId,
  });
}

/**
 * Update a user (admin only)
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation<
    GetApiV1UsersUserId200,
    Error,
    { userId: string; input: PutApiV1UsersUserIdBody }
  >({
    mutationFn: async ({ userId, input }) => {
      const response = await putApiV1UsersUserId(userId, input);
      const apiData = response.data as unknown as {
        data: GetApiV1UsersUserId200;
      };
      return apiData.data ?? { user: undefined };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

/**
 * Delete a user (admin only)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<DeleteApiV1UsersUserId200, Error, string>({
    mutationFn: async (userId: string) => {
      const response = await deleteApiV1UsersUserId(userId);
      const apiData = response.data as unknown as {
        data: DeleteApiV1UsersUserId200;
      };
      return apiData.data ?? { message: "" };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
