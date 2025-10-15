/**
 * Authentication Validation Schemas
 *
 * Zod schemas for validating authentication requests
 */

import { z } from "zod";

// ────────────────────────────────────────────────────────────────────────────
// User Schemas
// ────────────────────────────────────────────────────────────────────────────

export const createUserSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username must be at most 50 characters")
      .regex(
        /^[a-z0-9_-]+$/,
        "Username can only contain lowercase letters, numbers, hyphens, and underscores"
      ),
    email: z.string().email("Invalid email address").optional(),
    displayName: z
      .string()
      .min(1, "Display name is required")
      .max(100, "Display name must be at most 100 characters")
      .optional(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .optional(),
    pin: z
      .string()
      .regex(/^\d{4,8}$/, "PIN must be 4-8 digits")
      .optional(),
    isPasswordless: z.boolean().default(false),
    role: z.enum(["ADMIN", "USER", "GUEST"]).default("USER"),
  })
  .refine((data) => data.isPasswordless || data.password || data.pin, {
    message: "Either password, PIN, or passwordless flag must be provided",
    path: ["password"],
  });

export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(100, "Display name must be at most 100 characters")
    .optional(),
  avatar: z.string().url("Avatar must be a valid URL").optional(),
  role: z.enum(["ADMIN", "USER", "GUEST"]).optional(),
  isActive: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const changePinSchema = z.object({
  currentPin: z.string().regex(/^\d{4,8}$/, "Current PIN must be 4-8 digits"),
  newPin: z.string().regex(/^\d{4,8}$/, "New PIN must be 4-8 digits"),
});

// ────────────────────────────────────────────────────────────────────────────
// Authentication Schemas
// ────────────────────────────────────────────────────────────────────────────

export const loginSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    password: z.string().optional(),
    pin: z
      .string()
      .regex(/^\d{4,8}$/, "PIN must be 4-8 digits")
      .optional(),
  })
  .refine((data) => data.password || data.pin, {
    message: "Either password or PIN must be provided",
    path: ["password"],
  });

export const passwordlessLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

// ────────────────────────────────────────────────────────────────────────────
// API Key Schemas
// ────────────────────────────────────────────────────────────────────────────

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters"),
  scopes: z
    .array(z.string())
    .min(1, "At least one scope is required")
    .default(["*"]),
  expiresAt: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .optional(),
});

export const updateApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .optional(),
  scopes: z
    .array(z.string())
    .min(1, "At least one scope is required")
    .optional(),
  isActive: z.boolean().optional(),
  expiresAt: z
    .string()
    .datetime()
    .transform((str) => new Date(str))
    .optional()
    .nullable(),
});

// ────────────────────────────────────────────────────────────────────────────
// Session Schemas
// ────────────────────────────────────────────────────────────────────────────

export const revokeSessionSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
});
