import { z } from "zod";
import { MediaTypeSchema } from "./media.schemas.js";
import { CollectionSchema } from "./collection.schemas.js";

// ────────────────────────────────────────────────────────────────
// REQUEST SCHEMAS
// ────────────────────────────────────────────────────────────────

export const ScanRequestSchema = z.object({
  path: z.string(),
  mediaType: MediaTypeSchema,
  collectionName: z.string().optional(),
  updateExisting: z.boolean().optional(),
});

export const SyncRequestSchema = z.object({
  collectionName: z.string(),
  mediaType: MediaTypeSchema,
});

// ────────────────────────────────────────────────────────────────
// RESULT SCHEMAS
// ────────────────────────────────────────────────────────────────

export const ScanResultSchema = z.object({
  totalFiles: z.number(),
  stats: z.object({
    added: z.number(),
    updated: z.number(),
    skipped: z.number(),
  }),
  collection: CollectionSchema.optional(),
});

export const SyncResultSchema = z.object({
  stats: z.object({
    checked: z.number(),
    updated: z.number(),
    removed: z.number(),
  }),
  collection: CollectionSchema.optional(),
});

// ────────────────────────────────────────────────────────────────
// RESPONSE SCHEMAS
// ────────────────────────────────────────────────────────────────

export const ScanResponseSchema = z.object({
  message: z.string(),
  scan: ScanResultSchema,
});

export const SyncResponseSchema = z.object({
  message: z.string(),
  sync: SyncResultSchema,
});

export const SyncAllResponseSchema = z.object({
  message: z.string(),
  syncs: z.array(SyncResultSchema),
});

// ────────────────────────────────────────────────────────────────
// INFERRED TYPES
// ────────────────────────────────────────────────────────────────

export type ScanRequest = z.infer<typeof ScanRequestSchema>;
export type SyncRequest = z.infer<typeof SyncRequestSchema>;
export type ScanResult = z.infer<typeof ScanResultSchema>;
export type SyncResult = z.infer<typeof SyncResultSchema>;
export type ScanResponse = z.infer<typeof ScanResponseSchema>;
export type SyncResponse = z.infer<typeof SyncResponseSchema>;
export type SyncAllResponse = z.infer<typeof SyncAllResponseSchema>;
