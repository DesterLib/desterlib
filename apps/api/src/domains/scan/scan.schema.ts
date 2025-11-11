import { z } from "zod";
import { isDangerousRootPath } from "./helpers/path-validator.helper";

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
    )
    .refine(
      (path) => {
        // Prevent scanning dangerous root paths
        return !isDangerousRootPath(path);
      },
      {
        message:
          "Cannot scan system root directories or entire drives. Please specify a media folder (e.g., /Users/username/Movies or C:\\Media\\Movies)",
      }
    ),
  options: z
    .object({
      maxDepth: z
        .number()
        .int()
        .min(0)
        .max(10)
        .optional()
        .describe(
          "Maximum directory depth to scan. Defaults to 2 for movies, 4 for TV shows"
        ),
      mediaType: z.enum(["movie", "tv"]).default("movie"),
      fileExtensions: z.array(sanitizedStringSchema).max(20).optional(),
      libraryName: z.string().min(1).max(100).optional(),
      rescan: z.boolean().optional(),
      batchScan: z
        .boolean()
        .optional()
        .describe(
          "Enable batch scanning mode for large libraries. Automatically enabled for TV shows. Batches: 5 shows or 25 movies per batch."
        ),
    })
    .optional(),
});
