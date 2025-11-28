import { z } from "zod";
import { isDangerousRootPath } from "./helpers/path-validator.helper";

/**
 * General string validation schema
 */
const sanitizedStringSchema = z.string().max(1000, "String is too long");

/**
 * Regex pattern validation schema
 */
const regexPatternSchema = z
  .string()
  .max(500, "Regex pattern is too long")
  .refine(
    (pattern) => {
      try {
        new RegExp(pattern);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Invalid regex pattern",
    }
  )
  .optional();

/**
 * Media type depth configuration schema
 */
const mediaTypeDepthSchema = z
  .object({
    movie: z.number().int().min(0).max(10).optional(),
    tv: z.number().int().min(0).max(10).optional(),
  })
  .optional();

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
      // Media type configuration
      mediaType: z
        .enum(["movie", "tv"])
        .default("movie")
        .describe("Type of media to scan (movie or tv)"),

      // Depth configuration (per media type)
      mediaTypeDepth: mediaTypeDepthSchema.describe(
        "Per-media-type depth configuration. Allows different depths for movies vs TV shows."
      ),

      // File filtering
      filenamePattern: regexPatternSchema.describe(
        "Regex pattern to match filenames. Only files matching this pattern will be scanned. Example: '^.*S\\d{2}E\\d{2}.*$' for episode files."
      ),

      // Directory filtering
      directoryPattern: regexPatternSchema.describe(
        "Regex pattern to match directory names. Only directories matching this pattern will be scanned. Useful for specific folder structures."
      ),

      // Scan behavior
      rescan: z
        .boolean()
        .optional()
        .describe(
          "If true, re-fetches metadata even if it already exists. If false, skips items with existing metadata."
        ),

      // Scanning mode
      batchScan: z
        .boolean()
        .optional()
        .describe(
          "Enable batch scanning mode for large libraries. Automatically enabled for TV shows. Batches: 5 shows or 25 movies per batch."
        ),

      // Advanced options
      followSymlinks: z
        .boolean()
        .optional()
        .describe("Whether to follow symbolic links during scanning."),
    })
    .optional(),
});
