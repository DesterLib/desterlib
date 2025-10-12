export type ErrorExtra = Record<string, unknown> | undefined;

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly expose: boolean;
  public readonly extra: ErrorExtra;

  constructor(
    message: string,
    options?: {
      statusCode?: number;
      code?: string;
      expose?: boolean;
      extra?: ErrorExtra;
      cause?: unknown;
    }
  ) {
    super(message, { cause: options?.cause });
    this.name = this.constructor.name;
    this.statusCode = options?.statusCode ?? 500;
    this.code = options?.code ?? "INTERNAL_ERROR";
    this.expose = options?.expose ?? this.statusCode < 500;
    this.extra = options?.extra;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad Request", extra?: ErrorExtra) {
    super(message, {
      statusCode: 400,
      code: "BAD_REQUEST",
      expose: true,
      extra,
    });
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized", extra?: ErrorExtra) {
    super(message, {
      statusCode: 401,
      code: "UNAUTHORIZED",
      expose: true,
      extra,
    });
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden", extra?: ErrorExtra) {
    super(message, { statusCode: 403, code: "FORBIDDEN", expose: true, extra });
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not Found", extra?: ErrorExtra) {
    super(message, { statusCode: 404, code: "NOT_FOUND", expose: true, extra });
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", extra?: ErrorExtra) {
    super(message, { statusCode: 409, code: "CONFLICT", expose: true, extra });
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = "Unprocessable Entity", extra?: ErrorExtra) {
    super(message, {
      statusCode: 422,
      code: "UNPROCESSABLE_ENTITY",
      expose: true,
      extra,
    });
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too Many Requests", extra?: ErrorExtra) {
    super(message, {
      statusCode: 429,
      code: "TOO_MANY_REQUESTS",
      expose: true,
      extra,
    });
  }
}
