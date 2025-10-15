/**
 * Settings Validation Schemas
 */

import { z } from "zod";
import { MediaType } from "../../generated/prisma/index.js";

/**
 * Library input schema
 */
const librarySchema = z.object({
  name: z.string().min(1, "Library name is required"),
  type: z.nativeEnum(MediaType, {
    errorMap: () => ({
      message: "Invalid media type. Must be MOVIE, TV_SHOW, MUSIC, or COMIC",
    }),
  }),
  path: z.string().min(1, "Library path is required"),
});

/**
 * Complete setup schema
 */
export const completeSetupSchema = z.object({
  tmdbApiKey: z.string().min(1, "TMDB API key is required"),
  libraries: z.array(librarySchema).min(1, "At least one library is required"),
});

/**
 * Update settings schema
 */
export const updateSettingsSchema = z
  .object({
    tmdbApiKey: z.string().min(1).optional(),
    libraries: z.array(librarySchema).optional(),
  })
  .refine(
    (data) => data.tmdbApiKey !== undefined || data.libraries !== undefined,
    {
      message: "At least one field must be provided for update",
    }
  );
