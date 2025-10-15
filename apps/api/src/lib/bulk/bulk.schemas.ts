/**
 * Bulk Operations Validation Schemas
 */

import { z } from "zod";

/**
 * Bulk delete schema
 */
export const bulkDeleteSchema = z.object({
  mediaIds: z
    .array(z.string().uuid())
    .min(1, "At least one media ID is required")
    .max(1000, "Cannot delete more than 1000 items at once"),
  deleteFiles: z.boolean().optional().default(false),
});

/**
 * Bulk update schema
 */
export const bulkUpdateSchema = z.object({
  mediaIds: z
    .array(z.string().uuid())
    .min(1, "At least one media ID is required")
    .max(1000, "Cannot update more than 1000 items at once"),
  updates: z.object({
    genreIds: z.array(z.string().uuid()).optional(),
    personIds: z.array(z.string().uuid()).optional(),
    rating: z.number().min(0).max(10).optional(),
    notes: z.string().optional(),
  }),
});

/**
 * Bulk collection operation schema
 */
export const bulkCollectionSchema = z.object({
  mediaIds: z
    .array(z.string().uuid())
    .min(1, "At least one media ID is required")
    .max(1000, "Cannot process more than 1000 items at once"),
  collectionId: z.string().uuid("Invalid collection ID"),
});

/**
 * Bulk metadata refresh schema
 */
export const bulkMetadataRefreshSchema = z.object({
  mediaIds: z
    .array(z.string().uuid())
    .min(1, "At least one media ID is required")
    .max(500, "Cannot refresh more than 500 items at once"),
  force: z.boolean().optional().default(false),
});

export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>;
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>;
export type BulkCollectionInput = z.infer<typeof bulkCollectionSchema>;
export type BulkMetadataRefreshInput = z.infer<
  typeof bulkMetadataRefreshSchema
>;
