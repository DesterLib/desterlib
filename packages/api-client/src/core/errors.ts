import type { z } from "zod";

/**
 * Base API error class
 */
export class ApiError extends Error {
  /** HTTP status code */
  readonly statusCode?: number;
  /** Additional error data from the API */
  readonly data?: any;

  constructor(message: string, statusCode?: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (typeof (Error as any).captureStackTrace === "function") {
      (Error as any).captureStackTrace(this, ApiError);
    }
  }

  /**
   * Check if error is a client error (4xx)
   */
  isClientError(): boolean {
    return (
      this.statusCode !== undefined &&
      this.statusCode >= 400 &&
      this.statusCode < 500
    );
  }

  /**
   * Check if error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.statusCode !== undefined && this.statusCode >= 500;
  }
}

/**
 * Network-related errors (timeout, connection failed, etc.)
 */
export class NetworkError extends ApiError {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = "Authentication required", data?: any) {
    super(message, 401, data);
    this.name = "AuthenticationError";
  }
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = "Access forbidden", data?: any) {
    super(message, 403, data);
    this.name = "AuthorizationError";
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends ApiError {
  constructor(message: string = "Resource not found", data?: any) {
    super(message, 404, data);
    this.name = "NotFoundError";
  }
}

/**
 * Validation errors (422 or Zod validation failures)
 */
export class ValidationError extends ApiError {
  /** Zod validation errors if applicable */
  readonly validationErrors?: z.ZodIssue[];

  constructor(
    message: string = "Validation failed",
    validationErrors?: z.ZodIssue[],
    data?: any
  ) {
    super(message, 422, data);
    this.name = "ValidationError";
    this.validationErrors = validationErrors;
  }

  /**
   * Get a formatted list of validation errors
   */
  getValidationMessages(): string[] {
    if (!this.validationErrors) return [];

    return this.validationErrors.map((err) => {
      const path = err.path.join(".");
      return `${path}: ${err.message}`;
    });
  }
}

/**
 * Rate limit errors (429)
 */
export class RateLimitError extends ApiError {
  /** When the rate limit will reset */
  readonly resetAt?: Date;

  constructor(
    message: string = "Rate limit exceeded",
    resetAt?: Date,
    data?: any
  ) {
    super(message, 429, data);
    this.name = "RateLimitError";
    this.resetAt = resetAt;
  }
}

/**
 * Server errors (500-599)
 */
export class ServerError extends ApiError {
  constructor(
    message: string = "Internal server error",
    statusCode: number = 500,
    data?: any
  ) {
    super(message, statusCode, data);
    this.name = "ServerError";
  }
}

/**
 * Factory function to create appropriate error type based on status code
 */
export function createApiError(
  message: string,
  statusCode: number,
  data?: any
): ApiError {
  switch (statusCode) {
    case 401:
      return new AuthenticationError(message, data);
    case 403:
      return new AuthorizationError(message, data);
    case 404:
      return new NotFoundError(message, data);
    case 422:
      return new ValidationError(message, undefined, data);
    case 429:
      return new RateLimitError(message, undefined, data);
    default:
      if (statusCode >= 500) {
        return new ServerError(message, statusCode, data);
      }
      return new ApiError(message, statusCode, data);
  }
}
