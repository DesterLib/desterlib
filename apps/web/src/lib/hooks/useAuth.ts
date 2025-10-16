import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
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
        const response = await authClient.getSession();
        return (response.data?.user as unknown as User) ?? null;
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
      const response = await authClient.signIn.email({
        email: credentials.username, // Map username to email
        password: credentials.password || credentials.pin || "",
      });

      if (response.data?.token) {
        // Store token - better-auth doesn't return refreshToken in this response
        setTokens(
          response.data.token,
          "" // Refresh token is handled by better-auth internally
        );
      }

      return (response.data?.user as unknown as User) ?? null;
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
      const response = await authClient.signUp.email({
        email: data.email || data.username, // Use email if provided, otherwise username
        name: data.username, // Map username to name
        password: data.password || data.pin || "",
      });

      if (response.data?.token) {
        // Store token - better-auth doesn't return refreshToken in this response
        setTokens(
          response.data.token,
          "" // Refresh token is handled by better-auth internally
        );
      }

      return (response.data?.user as unknown as User) ?? null;
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
      try {
        await authClient.signOut();
      } catch {
        // Ignore errors, we're logging out anyway
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

      // Better-auth handles token refresh automatically
      const response = await authClient.getSession();

      // Note: getSession doesn't return token/refreshToken, it only returns session info
      // Token refresh is handled internally by better-auth

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
