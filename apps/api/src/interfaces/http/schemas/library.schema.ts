import { z } from "zod";
import { MediaType } from "@prisma/client";

/**
 * Schema for deleting a library
 */
export const deleteLibrarySchema = z.object({
  id: z.string().min(1, "Library ID is required"),
});

/**
 * Schema for updating a library
 */
export const updateLibrarySchema = z.object({
  id: z.string().min(1, "Library ID is required"),
  name: z.string().min(1, "Library name is required").optional(),
  description: z.string().optional(),
  posterUrl: z.string().url().optional().or(z.literal("")),
  backdropUrl: z.string().url().optional().or(z.literal("")),
  libraryPath: z.string().optional(),
  libraryType: z.nativeEnum(MediaType).optional(),
});

/**
 * Schema for getting libraries with optional filtering
 */
export const getLibrariesSchema = z.object({
  isLibrary: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform((val) => {
      if (val === undefined) return undefined;
      if (typeof val === "boolean") return val;
      return val === "true";
    }),
  libraryType: z.nativeEnum(MediaType).optional(),
});
