/**
 * Authentication types
 */

export interface User {
  id: string;
  username: string;
  email?: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  username: string;
  password?: string;
  pin?: string;
}

export interface RegisterData {
  username: string;
  email?: string;
  password?: string;
  pin?: string;
  role?: "USER" | "ADMIN";
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}
