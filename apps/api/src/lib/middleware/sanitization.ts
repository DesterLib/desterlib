import { Request, Response, NextFunction } from "express";
import { sanitizeObject } from "../utils/sanitization";
import { logger } from "../utils";

/**
 * Middleware to sanitize request data
 * This runs before validation and strips potentially dangerous content
 */
export function sanitizeInput(
  options: {
    sanitizeBody?: boolean;
    sanitizeQuery?: boolean;
    sanitizeParams?: boolean;
    sanitizeOptions?: {
      stripHtml?: boolean;
      escapeHtml?: boolean;
      trimWhitespace?: boolean;
      maxLength?: number;
    };
  } = {}
) {
  const {
    sanitizeBody = true,
    sanitizeQuery = true,
    sanitizeParams = true,
    sanitizeOptions = {
      stripHtml: true,
      trimWhitespace: true,
      maxLength: 10000,
    },
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize request body
      if (sanitizeBody && req.body && typeof req.body === "object") {
        req.body = sanitizeObject(req.body, sanitizeOptions);
      }

      // Sanitize query parameters
      if (sanitizeQuery && req.query && typeof req.query === "object") {
        req.query = sanitizeObject(
          req.query,
          sanitizeOptions
        ) as typeof req.query;
      }

      // Sanitize route parameters
      if (sanitizeParams && req.params && typeof req.params === "object") {
        req.params = sanitizeObject(
          req.params,
          sanitizeOptions
        ) as typeof req.params;
      }

      next();
    } catch (error) {
      logger.error(
        `Sanitization error: ${error instanceof Error ? error.message : error}`
      );
      return res.status(400).json({
        error: "Invalid input data",
        message: "Request data contains invalid or unsafe content",
      });
    }
  };
}
