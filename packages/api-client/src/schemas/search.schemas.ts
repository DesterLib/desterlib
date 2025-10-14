import { z } from "zod";
import { MediaSchema } from "./media.schemas.js";
import { CollectionSchema } from "./collection.schemas.js";

// ────────────────────────────────────────────────────────────────
// REQUEST SCHEMAS
// ────────────────────────────────────────────────────────────────

export const SearchFiltersSchema = z.object({
  q: z.string(),
  type: z.enum(["media", "collections"]).optional(),
});

// ────────────────────────────────────────────────────────────────
// RESPONSE SCHEMAS
// ────────────────────────────────────────────────────────────────

export const SearchResponseSchema = z.object({
  message: z.string(),
  query: z.string(),
  total: z.number(),
  media: z.array(MediaSchema).optional(),
  collections: z.array(CollectionSchema).optional(),
});

// ────────────────────────────────────────────────────────────────
// INFERRED TYPES
// ────────────────────────────────────────────────────────────────

export type SearchFilters = z.infer<typeof SearchFiltersSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
