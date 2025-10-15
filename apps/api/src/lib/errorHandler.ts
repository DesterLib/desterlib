import type { NextFunction, Request, Response } from "express";
import { AppError } from "./errors.js";
import logger from "../config/logger.js";

type ErrorEnvelope = {
  success: false;
  requestId: string;
  timestamp: string;
  path: string;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    suggestion?: string;
  };
};

function getRequestId(res: Response): string {
  const requestIdHeader = res.getHeader("x-request-id");
  return String(
    (Array.isArray(requestIdHeader) ? requestIdHeader[0] : requestIdHeader) ??
      "unknown"
  );
}

export function notFoundHandler(req: Request, res: Response): void {
  const payload: ErrorEnvelope = {
    success: false,
    requestId: getRequestId(res),
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.path,
    error: {
      code: "NOT_FOUND",
      message: `Route not found: ${req.method} ${req.path}`,
      suggestion:
        "Check the API documentation at /api-docs for available endpoints",
    },
  };
  res.status(404).json(payload);
}

/**
 * Get helpful suggestion based on error code
 */
function getErrorSuggestion(
  code: string,
  statusCode: number
): string | undefined {
  const suggestions: Record<string, string> = {
    VALIDATION_FAILED:
      "Check your request body/parameters match the expected format",
    UNAUTHORIZED: "Please provide valid authentication credentials",
    FORBIDDEN: "You don't have permission to access this resource",
    NOT_FOUND: "The requested resource was not found. Verify the ID or path",
    CONFLICT: "This resource already exists. Try a different identifier",
    TOO_MANY_REQUESTS:
      "You've made too many requests. Please wait before trying again",
    BAD_REQUEST: "Check your request format and parameters",
    INVALID_TOKEN:
      "Your authentication token is invalid or expired. Please log in again",
    CSRF_TOKEN_INVALID: "CSRF token is invalid. Refresh the page and try again",
  };

  // Return specific suggestion if available
  if (suggestions[code]) {
    return suggestions[code];
  }

  // Return generic suggestions based on status code
  if (statusCode === 401) {
    return "Authentication required. Please log in";
  }
  if (statusCode === 403) {
    return "Access denied. Check your permissions";
  }
  if (statusCode === 404) {
    return "Resource not found. Verify the request path";
  }
  if (statusCode >= 500) {
    return "An internal error occurred. Please try again later or contact support";
  }

  return undefined;
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    const suggestion = err.expose
      ? getErrorSuggestion(err.code, err.statusCode)
      : undefined;

    const payload: ErrorEnvelope = {
      success: false,
      requestId: getRequestId(res),
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.path,
      error: {
        code: err.code,
        message: err.expose ? err.message : "Internal Server Error",
        details: err.expose
          ? (err.extra as Record<string, unknown> | undefined)
          : undefined,
        suggestion,
      },
    };

    if (err.statusCode >= 500) {
      // Log server errors with stack for operators
      logger.error(`AppError [${err.code}]: ${err.message}`, {
        statusCode: err.statusCode,
        stack: err.stack,
        extra: err.extra,
        requestId: getRequestId(res),
        path: req.originalUrl || req.path,
        method: req.method,
      });
    }
    res.status(err.statusCode).json(payload);
    return;
  }

  // Unknown errors
  logger.error(
    "Unhandled error:",
    err instanceof Error ? err : new Error(String(err)),
    {
      path: req.originalUrl || req.path,
      method: req.method,
      requestId: getRequestId(res),
    }
  );

  const payload: ErrorEnvelope = {
    success: false,
    requestId: getRequestId(res),
    timestamp: new Date().toISOString(),
    path: req.originalUrl || req.path,
    error: {
      code: "INTERNAL_ERROR",
      message: "Internal Server Error",
      suggestion: "An unexpected error occurred. Please try again later",
    },
  };
  res.status(500).json(payload);
}
