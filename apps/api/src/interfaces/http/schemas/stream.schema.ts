import { z } from "zod";

/**
 * ID validation helper - accepts both CUID and UUID formats
 */
const idSchema = z
  .string()
  .min(1, "ID is required")
  .refine(
    (id) => {
      // CUID pattern: starts with 'c' followed by 24-25 alphanumeric chars
      const cuidPattern = /^c[a-z0-9]{24,25}$/;
      // UUID pattern: standard UUID format
      const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      return cuidPattern.test(id) || uuidPattern.test(id);
    },
    { message: "Invalid ID format" }
  );

/**
 * Schema for streaming any media file by ID
 */
export const streamMediaSchema = z.object({
  id: idSchema,
});
