import { z } from "zod";

/**
 * Schema for deleting a library
 */
export const deleteLibrarySchema = z.object({
  id: z.string().min(1, "Library ID is required"),
});
