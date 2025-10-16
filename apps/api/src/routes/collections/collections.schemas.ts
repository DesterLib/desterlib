/**
 * Validation Schemas for Collections API
 */

import { z } from "zod";
import {
  MediaType,
  CollectionVisibility,
} from "../../generated/prisma/index.js";

/**
 * Create collection request schema
 */
export const createCollectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z.string().max(1000).optional(),
  posterUrl: z.string().url().optional(),
  backdropUrl: z.string().url().optional(),
  isLibrary: z.boolean().default(false),
  libraryPath: z.string().optional(),
  libraryType: z.nativeEnum(MediaType).optional(),
  parentId: z.string().optional(),
  visibility: z.nativeEnum(CollectionVisibility).default("EVERYONE"),
  accessUserIds: z.array(z.string()).optional(),
});

/**
 * Update collection request schema
 */
export const updateCollectionSchema = createCollectionSchema.partial();

/**
 * Query parameters for listing collections
 */
export const listCollectionsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  isLibrary: z
    .string()
    .optional()
    .transform((val) => {
      if (val === undefined || val === "") return undefined;
      return val === "true" || val === "1";
    }),
  mediaType: z.nativeEnum(MediaType).optional(),
});

/**
 * Slug or ID parameter schema
 */
export const slugOrIdParamSchema = z.object({
  slugOrId: z.string().min(1, "Slug or ID is required"),
});

/**
 * ID parameter schema
 */
export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});
