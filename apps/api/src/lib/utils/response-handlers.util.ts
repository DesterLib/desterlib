/**
 * Standardized API Response Handlers
 *
 * This module provides utilities for consistent API response formatting
 * and centralized error handling across all controllers.
 */

import { Response, Request, NextFunction } from "express";
import logger from "./logger";

// ==================== Response Interfaces ====================

/**
 * Standard success response format
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    [key: string]: unknown;
  };
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
    received?: unknown;
  }>;
  stack?: string;
}

// ==================== Custom Error Classes ====================

/**
 * Base API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public errorType: string = "Internal server error",
  ) {
    super(message);
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 404 Not Found Error
 */
export class NotFoundError extends ApiError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, "Not found");
  }
}

/**
 * 400 Validation Error
 */
export class ValidationError extends ApiError {
  constructor(
    message: string,
    public details?: Array<{
      field: string;
      message: string;
      received?: unknown;
    }>,
  ) {
    super(message, 400, "Validation failed");
  }
}

/**
 * 401 Unauthorized Error
 */
export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401, "Unauthorized");
  }
}

/**
 * 403 Forbidden Error
 */
export class ForbiddenError extends ApiError {
  constructor(message: string = "Access forbidden") {
    super(message, 403, "Forbidden");
  }
}

/**
 * 409 Conflict Error
 */
export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, "Conflict");
  }
}

/**
 * 422 Unprocessable Entity Error
 */
export class UnprocessableEntityError extends ApiError {
  constructor(message: string) {
    super(message, 422, "Unprocessable entity");
  }
}

// ==================== Response Handlers ====================

/**
 * Send a standardized success response
 *
 * @param res - Express response object
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @param message - Optional success message
 * @param meta - Optional metadata (pagination, etc.)
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string,
  meta?: SuccessResponse["meta"],
): Response {
  const response: SuccessResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send a standardized error response
 *
 * @param res - Express response object
 * @param error - Error object or string
 * @param statusCode - HTTP status code (default: 500)
 * @param errorType - Error type/category
 * @param details - Optional validation details
 */
export function sendError(
  res: Response,
  error: Error | string,
  statusCode: number = 500,
  errorType: string = "Internal server error",
  details?: ErrorResponse["details"],
): Response {
  const message = typeof error === "string" ? error : error.message;

  const response: ErrorResponse = {
    success: false,
    error: errorType,
    message,
  };

  if (details) {
    response.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    response.stack = error.stack;
  }

  return res.status(statusCode).json(response);
}

// ==================== Async Handler Wrapper ====================

/**
 * Wrapper for async route handlers to catch errors and pass to error middleware
 *
 * Usage:
 * ```typescript
 * router.get('/path', asyncHandler(async (req, res) => {
 *   const data = await someAsyncOperation();
 *   return sendSuccess(res, data);
 * }));
 * ```
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ==================== Centralized Error Handler ====================

/**
 * Centralized error handling for controllers
 *
 * @param error - Error object
 * @param res - Express response object
 * @param context - Context string for logging (e.g., "Get movies controller")
 * @returns Express response
 */
export function handleControllerError(
  error: unknown,
  res: Response,
  context: string,
): Response {
  // Handle custom API errors
  if (error instanceof ApiError) {
    logger.error(`${context}: ${error.message}`, {
      statusCode: error.statusCode,
      errorType: error.errorType,
    });

    if (error instanceof ValidationError && error.details) {
      return sendError(
        res,
        error.message,
        error.statusCode,
        error.errorType,
        error.details,
      );
    }

    return sendError(res, error.message, error.statusCode, error.errorType);
  }

  // Handle standard errors
  const errorMessage =
    error instanceof Error ? error.message : "An unexpected error occurred";

  logger.error(`${context}: ${errorMessage}`, {
    error: error instanceof Error ? error.stack : error,
  });

  return sendError(res, errorMessage, 500, "Internal server error");
}

// ==================== Pagination Helpers ====================

/**
 * Extract pagination parameters from request query
 *
 * @param req - Express request object
 * @param defaultLimit - Default page size (default: 20)
 * @param maxLimit - Maximum page size (default: 100)
 * @returns Pagination parameters
 */
export function getPaginationParams(
  req: Request,
  defaultLimit: number = 20,
  maxLimit: number = 100,
): {
  page: number;
  limit: number;
  skip: number;
} {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(req.query.limit as string) || defaultLimit),
  );
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Create pagination metadata
 *
 * @param page - Current page number
 * @param limit - Items per page
 * @param total - Total number of items
 * @returns Pagination metadata
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number,
): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
