import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  postApiV1AuthLogin,
  postApiV1AuthRegister,
  postApiV1AuthLogout,
  getApiV1AuthMe,
  postApiV1AuthRefresh,
} from "@dester/api-client";
import "@/lib/api-client";
import type { User, LoginCredentials, RegisterData } from "@/types/auth";

const TOKEN_KEY = "dester_access_token";
const REFRESH_TOKEN_KEY = "dester_refresh_token";

// Token management
export const getAccessToken = () => localStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
export const setTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};
export const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Get current user
export function useCurrentUser() {
  return useQuery<User | null>({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const token = getAccessToken();
      if (!token) {
        return null;
      }

      try {
        const response = await getApiV1AuthMe();
        return (
          (response.data as unknown as { data: { user: User } })?.data?.user ??
          null
        );
      } catch (error) {
        console.error("Failed to fetch current user:", error);
        clearTokens();
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await postApiV1AuthLogin(credentials);
      const data = (
        response.data as unknown as {
          data: { user: User; accessToken: string; refreshToken: string };
        }
      )?.data;

      if (data?.accessToken && data?.refreshToken) {
        setTokens(data.accessToken, data.refreshToken);
      }

      return data.user;
    },
    onSuccess: (user) => {
      // Set the user data in the cache - this will immediately update useCurrentUser
      queryClient.setQueryData(["auth", "me"], user);
    },
  });
}

// Register mutation
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await postApiV1AuthRegister(data);
      const responseData = (
        response.data as unknown as {
          data: { user: User; accessToken: string; refreshToken: string };
        }
      )?.data;

      if (responseData?.accessToken && responseData?.refreshToken) {
        setTokens(responseData.accessToken, responseData.refreshToken);
      }

      return responseData.user;
    },
    onSuccess: (user) => {
      // Set the user data in the cache - this will immediately update useCurrentUser
      queryClient.setQueryData(["auth", "me"], user);
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          await postApiV1AuthLogout({ refreshToken });
        } catch {
          // Ignore errors, we're logging out anyway
        }
      }
      clearTokens();
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "me"], null);
      queryClient.clear();
    },
  });
}

// Refresh token
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const response = await postApiV1AuthRefresh({ refreshToken });
      const data = (
        response.data as unknown as {
          data: { accessToken: string; refreshToken: string };
        }
      )?.data;

      if (data?.accessToken && data?.refreshToken) {
        setTokens(data.accessToken, data.refreshToken);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
