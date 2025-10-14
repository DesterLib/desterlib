import { z } from "zod";
import { MediaTypeSchema, MediaCollectionSchema } from "./media.schemas.js";

// ────────────────────────────────────────────────────────────────
// COLLECTION SCHEMAS
// ────────────────────────────────────────────────────────────────

export const CollectionSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
    description: z.string().optional(),
    posterUrl: z.string().optional(),
    backdropUrl: z.string().optional(),
    isLibrary: z.boolean(),
    libraryPath: z.string().optional(),
    libraryType: MediaTypeSchema.optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    parentId: z.string().optional(),
    parent: CollectionSchema.optional(),
    children: z.array(CollectionSchema).optional(),
    media: z.array(MediaCollectionSchema).optional(),
    settingsId: z.string().optional(),
  })
);

// ────────────────────────────────────────────────────────────────
// RESPONSE SCHEMAS
// ────────────────────────────────────────────────────────────────

export const CollectionListResponseSchema = z.object({
  message: z.string(),
  collections: z.array(CollectionSchema),
});

export const CollectionResponseSchema = z.object({
  message: z.string(),
  collection: CollectionSchema,
});

// ────────────────────────────────────────────────────────────────
// INFERRED TYPES
// ────────────────────────────────────────────────────────────────

export type Collection = z.infer<typeof CollectionSchema>;
export type CollectionListResponse = z.infer<
  typeof CollectionListResponseSchema
>;
export type CollectionResponse = z.infer<typeof CollectionResponseSchema>;
