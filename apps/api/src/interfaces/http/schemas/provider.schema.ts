import { z } from "zod";

/**
 * Schema for getting a provider by name (from URL params)
 */
export const getProviderByNameSchema = z.object({
  name: z.string().min(1, "Provider name is required"),
});

/**
 * Schema for creating or updating a provider
 */
export const upsertProviderSchema = z.object({
  name: z.string().min(1, "Provider name is required").optional(),
  enabled: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for updating a provider (from URL params + body)
 */
export const updateProviderSchema = z.object({
  name: z.string().min(1, "Provider name is required"),
  enabled: z.boolean().optional(),
  priority: z.number().int().min(0).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Schema for deleting a provider (from URL params)
 */
export const deleteProviderSchema = z.object({
  name: z.string().min(1, "Provider name is required"),
});
