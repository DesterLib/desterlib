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

export class ForbiddenError extends ApiError {
  constructor(message: string = "Access forbidden") {
    super(message, 403, "Forbidden");
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409, "Conflict");
  }
}

export class UnprocessableEntityError extends ApiError {
  constructor(message: string) {
    super(message, 422, "Unprocessable entity");
  }
}
