import { createContext, type ReactNode } from "react";
// Temporarily disabled imports due to auth bypass
// import { signIn, signUp, signOut } from "@/lib/auth-client";
import { signUp, signOut } from "@/lib/auth-client";
// import { signIn } from "@/lib/auth-client";
// import { useSession } from "@/lib/auth-client";
// import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import type {
  AuthContextType,
  LoginCredentials,
  RegisterData,
} from "@/types/auth";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Temporarily disabled sessions due to auth bypass
  // const { data: session, isPending } = useSession();
  // const { isOnline } = useOnlineStatus();

  const login = async (_credentials: LoginCredentials) => {
    // TEMPORARY: Bypass actual authentication during auth disable
    // Simply return success without making API calls
    return Promise.resolve();

    // Original authentication logic commented out for temporary disable
    /*
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
    */
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

  // TEMPORARY: Always provide authenticated user - bypass all auth checks
  const tempUser = {
    id: "temp-user",
    username: "Temporary User",
    email: "temp@local",
    role: "ADMIN" as const, // Give admin role for full access
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // In offline mode, provide a mock offline user (temporarily unused)
  // const offlineUser = !isOnline
  //   ? {
  //       id: "offline-user",
  //       username: "Offline User",
  //       email: "offline@local",
  //       role: "USER" as const,
  //       createdAt: new Date().toISOString(),
  //       updatedAt: new Date().toISOString(),
  //     }
  //   : null;

  const value: AuthContextType = {
    // TEMPORARY: Always return authenticated user
    user: tempUser,

    // Original logic commented out for temporary disable
    /*
    user: !isOnline
      ? offlineUser
      : session?.user
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
    */
    isLoading: false, // TEMPORARY: Always false since we're not loading auth
    isAuthenticated: true, // TEMPORARY: Always authenticated
    login,
    register,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Export context for hooks/useAuth.ts
export { AuthContext };
