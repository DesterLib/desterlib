import { createContext, type ReactNode } from "react";
import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";
import type {
  AuthContextType,
  LoginCredentials,
  RegisterData,
} from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();

  const login = async (credentials: LoginCredentials) => {
    // Convert username to email format if it doesn't contain @
    const emailOrUsername = credentials.username.includes("@")
      ? credentials.username
      : `${credentials.username}@dester.local`;

    const result = await signIn.email({
      email: emailOrUsername,
      password: credentials.password || credentials.pin || "",
      fetchOptions: {
        onSuccess: () => {
          // Session established successfully
        },
        onError: (ctx) => {
          throw new Error(ctx.error.message || "Login failed");
        },
      },
    });

    if (result.error) {
      throw new Error(result.error.message || "Login failed");
    }
  };

  const register = async (data: RegisterData) => {
    const result = await signUp.email({
      email: data.email || `${data.username}@dester.local`,
      password: data.password || data.pin || "",
      name: data.username,
      fetchOptions: {
        body: {
          username: data.username,
        },
        onSuccess: () => {
          // Registration successful
        },
        onError: (ctx) => {
          throw new Error(ctx.error.message || "Registration failed");
        },
      },
    });

    if (result.error) {
      throw new Error(result.error.message || "Registration failed");
    }
  };

  const logout = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/login";
        },
      },
    });
  };

  const refreshAuth = async () => {
    // Better-auth handles this automatically
  };

  const value: AuthContextType = {
    user: session?.user
      ? {
          id: session.user.id,
          username: session.user.name || session.user.email || "",
          email: session.user.email || "",
          role:
            ((session.user as unknown as { role?: string }).role as
              | "USER"
              | "ADMIN"
              | "GUEST") || "USER",
          createdAt:
            session.user.createdAt?.toString() || new Date().toISOString(),
          updatedAt:
            session.user.updatedAt?.toString() || new Date().toISOString(),
        }
      : null,
    isLoading: isPending,
    isAuthenticated: !!session?.user,
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export context for hooks/useAuth.ts
export { AuthContext };
