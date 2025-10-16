import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

// Export hooks for easier access
export const { useSession, signIn, signUp, signOut } = authClient;
