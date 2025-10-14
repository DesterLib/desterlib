import { z } from "zod";
import { CollectionSchema } from "./collection.schemas.js";

// ────────────────────────────────────────────────────────────────
// SETTINGS SCHEMAS
// ────────────────────────────────────────────────────────────────

export const SettingsSchema = z.object({
  id: z.string(),
  isSetupComplete: z.boolean(),
  tmdbApiKey: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  libraries: z.array(CollectionSchema).optional(),
});

// ────────────────────────────────────────────────────────────────
// RESPONSE SCHEMAS
// ────────────────────────────────────────────────────────────────

export const SettingsResponseSchema = z.object({
  message: z.string(),
  settings: SettingsSchema,
});

export const SetupStatusResponseSchema = z.object({
  isSetupComplete: z.boolean(),
});

// ────────────────────────────────────────────────────────────────
// INFERRED TYPES
// ────────────────────────────────────────────────────────────────

export type Settings = z.infer<typeof SettingsSchema>;
export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;
export type SetupStatusResponse = z.infer<typeof SetupStatusResponseSchema>;
