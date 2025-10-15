/**
 * Request Validation Middleware
 *
 * Provides Zod-based validation for request body, query params, and URL params.
 *
 * Usage:
 *   import { validateRequest } from '../lib/validation.js';
 *   import { z } from 'zod';
 *
 *   const createUserSchema = z.object({
 *     name: z.string(),
 *     email: z.string().email(),
 *   });
 *
 *   router.post('/users',
 *     validateRequest({ body: createUserSchema }),
 *     userController.create
 *   );
 */

import type { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { BadRequestError } from "./errors.js";

interface ValidationSchemas {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}

/**
 * Validate request data against Zod schemas
 */
export function validateRequest(schemas: ValidationSchemas) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // Validate request body
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }

      // Validate URL parameters
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Transform Zod errors into user-friendly format
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        throw new BadRequestError("Validation failed", {
          errors: formattedErrors,
        });
      }
      next(error);
    }
  };
}

/**
 * Sanitize string input to prevent XSS attacks
 */
function sanitizeString(str: string): string {
  return str
    .replace(/[<>]/g, "") // Remove < and >
    .trim();
}

/**
 * Custom Zod string transformer with XSS prevention
 */
export const safeString = (options?: { min?: number; max?: number }) =>
  z
    .string()
    .transform(sanitizeString)
    .refine(
      (val) => {
        if (options?.min && val.length < options.min) return false;
        if (options?.max && val.length > options.max) return false;
        return true;
      },
      {
        message: `String must be between ${options?.min || 0} and ${
          options?.max || "unlimited"
        } characters`,
      }
    );

/**
 * Common validation schemas that can be reused
 */
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    limit: z.coerce.number().int().positive().max(100).default(50),
    offset: z.coerce.number().int().nonnegative().default(0),
    page: z.coerce.number().int().positive().optional(),
  }),

  // Pagination with cursor
  cursorPagination: z.object({
    limit: z.coerce.number().int().positive().max(100).default(50),
    cursor: z.string().optional(),
  }),

  // Sorting
  sort: z.object({
    sortBy: z
      .string()
      .regex(/^[a-zA-Z_]+$/, "Invalid sort field")
      .optional(),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
  }),

  // ID parameter
  id: z.object({
    id: z.string().cuid("Invalid ID format"),
  }),

  // Slug parameter
  slug: z.object({
    slug: z
      .string()
      .min(1, "Slug is required")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug must contain only lowercase letters, numbers, and hyphens"
      ),
  }),

  // Slug or ID parameter
  slugOrId: z.object({
    slugOrId: z.string().min(1, "Slug or ID is required"),
  }),

  // Search query
  search: z.object({
    q: safeString({ min: 1, max: 200 }),
    type: z.enum(["MOVIE", "TV_SHOW", "MUSIC", "COMIC", "all"]).optional(),
  }),

  // Date range filter
  dateRange: z.object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  }),

  // Media type filter
  mediaType: z.object({
    type: z.enum(["MOVIE", "TV_SHOW", "MUSIC", "COMIC"]).optional(),
  }),

  // Filename validation (for file operations)
  filename: z.object({
    filename: z
      .string()
      .min(1, "Filename is required")
      .regex(/^[a-zA-Z0-9._-]+$/, "Invalid filename format"),
  }),

  // Boolean flag
  booleanFlag: z
    .string()
    .transform((val) => val === "true" || val === "1")
    .or(z.boolean()),
};
