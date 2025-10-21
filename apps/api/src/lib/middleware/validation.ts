import { Request, Response, NextFunction } from "express";
import { z, ZodSchema, ZodError } from "zod";
import { sanitizeObject } from "../utils/sanitization";

type SanitizeOptions = {
  stripHtml?: boolean;
  escapeHtml?: boolean;
  trimWhitespace?: boolean;
  maxLength?: number;
};

type ValidateOptions = {
  sanitize?: boolean;
  sanitizeOptions?: SanitizeOptions;
};

/**
 * Validation middleware factory that creates middleware for validating request data
 * @param schema - Zod schema to validate against
 * @param dataSource - Where to get the data from ('body' | 'query' | 'params')
 */
export function validate(
  schema: ZodSchema,
  dataSource: "body" | "query" | "params" = "body",
  options: ValidateOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sanitize = true, sanitizeOptions = {} } = options;
      let dataToValidate = req[dataSource];

      // Sanitize input data before validation
      if (sanitize && dataToValidate) {
        dataToValidate = sanitizeObject(dataToValidate, {
          stripHtml: true,
          trimWhitespace: true,
          maxLength: 10000,
          ...sanitizeOptions,
        });
      }

      const validatedData = schema.parse(dataToValidate);

      // Store validated and sanitized data in request for use in route handlers
      req.validatedData = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((err: z.ZodIssue) => ({
            field: err.path.join("."),
            message: err.message,
            received: err.input,
          })),
        });
      }

      next(error);
    }
  };
}

/**
 * Utility function to validate request body with optional sanitization
 */
export function validateBody(schema: ZodSchema, options?: ValidateOptions) {
  return validate(schema, "body", options);
}

/**
 * Utility function to validate query parameters with optional sanitization
 */
export function validateQuery(schema: ZodSchema, options?: ValidateOptions) {
  return validate(schema, "query", options);
}

/**
 * Utility function to validate route parameters with optional sanitization
 */
export function validateParams(schema: ZodSchema, options?: ValidateOptions) {
  return validate(schema, "params", options);
}
