/**
 * Custom error classes for API
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public errorType: string = "Internal server error"
  ) {
    super(message);
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(message, 404, "Not found");
  }
}

export class ValidationError extends ApiError {
  constructor(
    message: string,
    public details?: Array<{
      field: string;
      message: string;
      received?: unknown;
    }>
  ) {
    super(message, 400, "Validation failed");
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401, "Unauthorized");
  }
}

/**
 * Custom error with error code for metadata processing
 */
export class MetadataError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "MetadataError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error codes for metadata processing
 */
export const METADATA_ERROR_CODES = {
  MEDIA_NOT_FOUND: "MEDIA_NOT_FOUND",
} as const;

export type MetadataErrorCode =
  (typeof METADATA_ERROR_CODES)[keyof typeof METADATA_ERROR_CODES];
