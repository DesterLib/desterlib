/**
 * Common Validation Schemas
 *
 * Reusable Zod schemas for common API operations across all routes.
 * Import these into route handlers to ensure consistent validation.
 */

import { z } from "zod";
import { safeString } from "./validation.js";

// ────────────────────────────────────────────────────────────────────────────
// Media Schemas
// ────────────────────────────────────────────────────────────────────────────

export const mediaListQuerySchema = z.object({
  type: z.enum(["MOVIE", "TV_SHOW", "MUSIC", "COMIC"]).optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
  sortBy: z.enum(["title", "releaseDate", "rating", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  genre: z.string().optional(),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
});

export const mediaIdParamSchema = z.object({
  id: z.string().cuid("Invalid media ID"),
});

export const createMediaSchema = z.object({
  title: safeString({ min: 1, max: 255 }),
  type: z.enum(["MOVIE", "TV_SHOW", "MUSIC", "COMIC"]),
  description: safeString({ max: 5000 }).optional(),
  posterUrl: z.string().url().optional().or(z.literal("")),
  backdropUrl: z.string().url().optional().or(z.literal("")),
  releaseDate: z.coerce.date().optional(),
  rating: z.number().min(0).max(10).optional(),
});

export const updateMediaSchema = createMediaSchema.partial();

// ────────────────────────────────────────────────────────────────────────────
// Collection Schemas
// ────────────────────────────────────────────────────────────────────────────

export const collectionListQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0),
  isLibrary: z
    .string()
    .transform((val) => val === "true")
    .or(z.boolean())
    .optional(),
});

export const createCollectionSchema = z.object({
  name: safeString({ min: 1, max: 255 }),
  description: safeString({ max: 1000 }).optional(),
  posterUrl: z.string().url().optional().or(z.literal("")),
  backdropUrl: z.string().url().optional().or(z.literal("")),
  isLibrary: z.boolean().default(false),
  libraryPath: z.string().optional(),
  libraryType: z.enum(["MOVIE", "TV_SHOW", "MUSIC", "COMIC"]).optional(),
  parentId: z.string().cuid().optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export const addMediaToCollectionSchema = z.object({
  mediaIds: z.array(z.string().cuid()).min(1, "At least one media ID required"),
  order: z.number().int().optional(),
});

// ────────────────────────────────────────────────────────────────────────────
// Search Schemas
// ────────────────────────────────────────────────────────────────────────────

export const searchQuerySchema = z.object({
  q: safeString({ min: 1, max: 200 }),
  type: z.enum(["MOVIE", "TV_SHOW", "MUSIC", "COMIC", "all"]).default("all"),
  limit: z.coerce.number().int().positive().max(50).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// ────────────────────────────────────────────────────────────────────────────
// Settings Schemas
// ────────────────────────────────────────────────────────────────────────────

export const updateSettingsSchema = z.object({
  tmdbApiKey: z.string().min(1).optional(),
  requireAuth: z.boolean().optional(),
  allowRegistration: z.boolean().optional(),
  sessionDuration: z.number().int().positive().optional(),
});

// ────────────────────────────────────────────────────────────────────────────
// Scan Schemas
// ────────────────────────────────────────────────────────────────────────────

export const scanPathSchema = z.object({
  path: z.string().min(1, "Path is required"),
  type: z.enum(["MOVIE", "TV_SHOW", "MUSIC", "COMIC"]),
  collectionId: z.string().cuid().optional(),
});

export const scanStatusQuerySchema = z.object({
  jobId: z.string().optional(),
});

// ────────────────────────────────────────────────────────────────────────────
// Genre Schemas
// ────────────────────────────────────────────────────────────────────────────

export const createGenreSchema = z.object({
  name: safeString({ min: 1, max: 100 }),
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: safeString({ max: 500 }).optional(),
});

export const updateGenreSchema = createGenreSchema.partial();

// ────────────────────────────────────────────────────────────────────────────
// Person Schemas
// ────────────────────────────────────────────────────────────────────────────

export const createPersonSchema = z.object({
  name: safeString({ min: 1, max: 255 }),
  bio: safeString({ max: 2000 }).optional(),
  birthDate: z.coerce.date().optional(),
  profileUrl: z.string().url().optional().or(z.literal("")),
});

export const updatePersonSchema = createPersonSchema.partial();

// ────────────────────────────────────────────────────────────────────────────
// File Upload Schemas
// ────────────────────────────────────────────────────────────────────────────

export const fileUploadSchema = z.object({
  mimetype: z
    .string()
    .regex(/^(image|video|audio|application)\/.+$/, "Invalid file type"),
  size: z
    .number()
    .positive()
    .max(100 * 1024 * 1024), // 100MB max
  originalname: safeString({ min: 1, max: 255 }),
});

// ────────────────────────────────────────────────────────────────────────────
// Notification Schemas
// ────────────────────────────────────────────────────────────────────────────

export const notificationQuerySchema = z.object({
  unreadOnly: z
    .string()
    .transform((val) => val === "true")
    .or(z.boolean())
    .optional(),
  limit: z.coerce.number().int().positive().max(100).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const markNotificationSchema = z.object({
  notificationIds: z.array(z.string().cuid()),
  read: z.boolean(),
});
