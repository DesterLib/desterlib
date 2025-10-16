/**
 * User Management Validation Schemas
 */

import { z } from "zod";

/**
 * Schema for updating a user (admin only)
 */
export const updateUserSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  displayName: z.string().min(1).max(100).optional(),
  avatar: z.string().url("Invalid avatar URL").optional(),
  role: z.enum(["SUPER_ADMIN", "ADMIN", "USER", "GUEST"]).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
