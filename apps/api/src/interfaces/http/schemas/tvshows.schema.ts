import { z } from "zod";

/**
 * CUID validation helper
 */
const cuidSchema = z
  .string()
  .min(1, "ID is required")
  .regex(/^c[a-z0-9]{24,25}$/, "Invalid ID format");

/**
 * Schema for getting a TV show by ID
 */
export const getTVShowByIdSchema = z.object({
  id: cuidSchema,
});
