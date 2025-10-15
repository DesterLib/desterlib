/**
 * Validation Schemas for Scan API
 */

import { z } from "zod";
import { MediaType } from "../../generated/prisma/index.js";

/**
 * Scan request body schema
 */
export const scanRequestSchema = z.object({
  path: z.string().min(1, "Path is required"),
  mediaType: z.nativeEnum(MediaType, {
    errorMap: () => ({
      message: "Media type must be one of: MOVIE, TV_SHOW, MUSIC, COMIC",
    }),
  }),
  collectionName: z.string().optional(),
  updateExisting: z.boolean().default(false),
});

/**
 * Sync request body schema
 */
export const syncRequestSchema = z.object({
  collectionId: z.string().min(1, "Collection ID is required"),
});

/**
 * Library ID parameter schema
 */
export const libraryIdParamSchema = z.object({
  libraryId: z.string().min(1, "Library ID is required"),
});
