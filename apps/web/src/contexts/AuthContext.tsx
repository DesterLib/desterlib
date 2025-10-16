import { createContext, type ReactNode } from "react";
import {
  useCurrentUser,
  useLogin,
  useLogout,
  useRegister,
} from "@/lib/hooks/useAuth";
import type {
  AuthContextType,
  LoginCredentials,
  RegisterData,
} from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();

  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const refreshAuth = async () => {
    // Handled by React Query refetch
  };

  const value: AuthContextType = {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export context for hooks/useAuth.ts
export { AuthContext };
