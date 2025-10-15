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
 * Common validation schemas that can be reused
 */
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    limit: z.coerce.number().int().positive().max(100).default(50),
    offset: z.coerce.number().int().nonnegative().default(0),
  }),

  // ID parameter
  id: z.object({
    id: z.string().min(1, "ID is required"),
  }),

  // Slug parameter
  slug: z.object({
    slug: z.string().min(1, "Slug is required"),
  }),

  // Slug or ID parameter
  slugOrId: z.object({
    slugOrId: z.string().min(1, "Slug or ID is required"),
  }),

  // Search query
  search: z.object({
    q: z.string().min(1, "Search query is required"),
  }),
};
