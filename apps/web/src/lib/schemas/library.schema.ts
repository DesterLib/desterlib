import { z } from "zod";

/**
 * Media type enum
 */
export const MediaTypeSchema = z.enum(["MOVIE", "TV_SHOW", "MUSIC", "COMIC"]);

export type MediaType = z.infer<typeof MediaTypeSchema>;

/**
 * Library form schema for creating/editing libraries
 */
export const LibraryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Library name is required")
    .max(100, "Library name must be less than 100 characters"),
  path: z
    .string()
    .min(1, "Library path is required")
    .refine((path) => path.startsWith("/"), {
      message: "Path must be an absolute path starting with /",
    }),
  type: MediaTypeSchema,
  description: z.string().optional(),
  posterUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  backdropUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
});

export type LibraryFormValues = z.infer<typeof LibraryFormSchema>;

/**
 * Settings update schema
 */
export const SettingsUpdateSchema = z.object({
  tmdbApiKey: z.string().optional(),
  autoFetchMetadata: z.boolean().optional(),
  autoScanInterval: z.number().min(1).max(24).optional(),
  fileSizeTracking: z.boolean().optional(),
  fileModifiedTracking: z.boolean().optional(),
});

export type SettingsUpdateValues = z.infer<typeof SettingsUpdateSchema>;
