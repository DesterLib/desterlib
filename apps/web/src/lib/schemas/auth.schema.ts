import { z } from "zod";

export const loginSchema = z
  .object({
    username: z
      .string()
      .min(1, "Username is required")
      .regex(
        /^[a-z0-9_-]+$/,
        "Username can only contain lowercase letters, numbers, hyphens, and underscores"
      ),
    password: z.string().optional(),
    pin: z.string().optional(),
  })
  .refine((data) => data.password || data.pin, {
    message: "Either password or PIN is required",
    path: ["password"],
  });

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .regex(
        /^[a-z0-9_-]+$/,
        "Username can only contain lowercase letters, numbers, hyphens, and underscores"
      ),
    email: z
      .string()
      .email("Invalid email address")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    confirmPassword: z.string().optional(),
    pin: z
      .string()
      .min(4, "PIN must be at least 4 digits")
      .max(6, "PIN must be at most 6 digits")
      .optional(),
    confirmPin: z.string().optional(),
  })
  .refine((data) => data.password || data.pin, {
    message: "Either password or PIN is required",
    path: ["password"],
  })
  .refine((data) => !data.password || data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => !data.pin || data.pin === data.confirmPin, {
    message: "PINs do not match",
    path: ["confirmPin"],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
