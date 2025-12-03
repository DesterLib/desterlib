import { z } from "zod";

/**
 * Schema for getting an image by path
 * Path should be relative to metadata directory (e.g., movies/posters/tmdb12345.jpg)
 * The route /api/v1/image/{path} will handle the path parameter
 */
export const getImageSchema = z.object({
  path: z
    .string()
    .min(1, "Path is required")
    .refine(
      (path) => !path.includes(".."),
      "Path must not contain '..' for security"
    ),
});
