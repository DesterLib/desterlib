import { z } from "zod";

/**
 * General string validation schema
 */
const sanitizedStringSchema = z.string().max(1000, "String is too long");

/**
 * File path validation schema for scanning local directories
 */
export const scanPathSchema = z.object({
  path: z
    .string()
    .min(1, "Path is required")
    .max(5000, "Path is too long")
    .refine(
      (path) => {
        // Basic path validation - no directory traversal, no dangerous characters
        return (
          !path.includes("..") &&
          !path.includes("<") &&
          !path.includes(">") &&
          !path.includes("\0")
        );
      },
      {
        message: "Invalid or unsafe file path",
      }
    ),
  options: z
    .object({
      maxDepth: z.number().int().min(0).max(10).optional(),
      mediaType: z.enum(["movie", "tv"]).optional(),
      fileExtensions: z.array(sanitizedStringSchema).max(20).optional(),
      libraryName: z.string().min(1).max(100).optional(),
      rescan: z.boolean().optional(),
    })
    .optional(),
});
