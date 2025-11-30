import { z } from "zod";
import { normalizePath } from "../../../infrastructure/utils/path.utils";

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
        message: "Path contains invalid or dangerous characters",
      }
    )
    .transform((path) => normalizePath(path)), // Normalize path
  name: z
    .string()
    .min(1, "Library name must be at least 1 character")
    .max(255, "Library name is too long")
    .optional(),
  description: z
    .string()
    .max(1000, "Description is too long")
    .optional()
    .nullable(),
  options: z.object({
    mediaType: z
      .string()
      .transform((val) => {
        // Normalize to lowercase for case-insensitive handling
        // Accepts: "Movies", "Movie", "movies", "movie" -> "movie"
        // Accepts: "TV", "Tv", "tv", "TVShow", "tv-show" -> "tv"
        if (typeof val === "string") {
          const normalized = val.toLowerCase().trim();
          if (normalized === "movies" || normalized === "movie") {
            return "movie";
          }
          if (
            normalized === "tv" ||
            normalized === "tvshow" ||
            normalized === "tv-show" ||
            normalized === "tv show"
          ) {
            return "tv";
          }
          // If it doesn't match, return as-is and let enum validation catch it
          return normalized;
        }
        return val;
      })
      .pipe(z.enum(["movie", "tv"])),
    mediaTypeDepth: mediaTypeDepthSchema,
    filenamePattern: regexPatternSchema,
    directoryPattern: regexPatternSchema,
    rescan: z.boolean().optional(),
    followSymlinks: z.boolean().optional(),
  }),
});

export type ScanPathRequest = z.infer<typeof scanPathSchema>;
