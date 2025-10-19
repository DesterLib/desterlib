import { Request, Response, NextFunction } from "express";
import { z, ZodSchema, ZodError } from "zod";

/**
 * Validation middleware factory that creates middleware for validating request data
 * @param schema - Zod schema to validate against
 * @param dataSource - Where to get the data from ('body' | 'query' | 'params')
 */
export function validate(
  schema: ZodSchema,
  dataSource: "body" | "query" | "params" = "body"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dataToValidate = req[dataSource];
      const validatedData = schema.parse(dataToValidate);

      // Store validated data in request for use in route handlers
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
 * Utility function to validate request body
 */
export function validateBody(schema: ZodSchema) {
  return validate(schema, "body");
}

/**
 * Utility function to validate query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return validate(schema, "query");
}

/**
 * Utility function to validate route parameters
 */
export function validateParams(schema: ZodSchema) {
  return validate(schema, "params");
}
