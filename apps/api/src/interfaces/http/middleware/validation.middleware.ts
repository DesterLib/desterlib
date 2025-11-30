import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import {
  sanitizeObject,
  SanitizeOptions,
} from "../../../infrastructure/utils/sanitization";

type ValidateOptions = {
  sanitize?: boolean;
  sanitizeOptions?: SanitizeOptions;
};

export function validate(
  schema: z.ZodTypeAny,
  dataSource: "body" | "query" | "params" = "body",
  options: ValidateOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sanitize = true, sanitizeOptions = {} } = options;
      let dataToValidate = req[dataSource];

      if (sanitize && dataToValidate) {
        dataToValidate = sanitizeObject(dataToValidate, {
          stripHtml: true,
          trimWhitespace: true,
          maxLength: 10000,
          ...sanitizeOptions,
        });
      }

      const validatedData = schema.parse(dataToValidate);
      req.validatedData = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: "Validation failed",
          details: error.issues.map((err) => ({
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

export function validateBody(schema: z.ZodTypeAny, options?: ValidateOptions) {
  return validate(schema, "body", options);
}

export function validateQuery(schema: z.ZodTypeAny, options?: ValidateOptions) {
  return validate(schema, "query", options);
}

export function validateParams(
  schema: z.ZodTypeAny,
  options?: ValidateOptions
) {
  return validate(schema, "params", options);
}
