/**
 * Error Classes Tests
 */

import { describe, it, expect } from "vitest";
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  UnprocessableEntityError,
  TooManyRequestsError,
} from "../errors.js";

describe("AppError", () => {
  it("should create error with default values", () => {
    const error = new AppError("Test error");

    expect(error.message).toBe("Test error");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_ERROR");
    expect(error.expose).toBe(false);
    expect(error.extra).toBeUndefined();
  });

  it("should create error with custom values", () => {
    const error = new AppError("Custom error", {
      statusCode: 400,
      code: "CUSTOM_CODE",
      expose: true,
      extra: { field: "value" },
    });

    expect(error.message).toBe("Custom error");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("CUSTOM_CODE");
    expect(error.expose).toBe(true);
    expect(error.extra).toEqual({ field: "value" });
  });

  it("should expose 4xx errors by default", () => {
    const error = new AppError("Client error", { statusCode: 404 });
    expect(error.expose).toBe(true);
  });

  it("should not expose 5xx errors by default", () => {
    const error = new AppError("Server error", { statusCode: 500 });
    expect(error.expose).toBe(false);
  });

  it("should support error cause", () => {
    const cause = new Error("Original error");
    const error = new AppError("Wrapped error", { cause });

    expect(error.cause).toBe(cause);
  });
});

describe("BadRequestError", () => {
  it("should create 400 error with default message", () => {
    const error = new BadRequestError();

    expect(error.message).toBe("Bad Request");
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.expose).toBe(true);
  });

  it("should create 400 error with custom message", () => {
    const error = new BadRequestError("Invalid input");

    expect(error.message).toBe("Invalid input");
    expect(error.statusCode).toBe(400);
  });

  it("should include extra data", () => {
    const error = new BadRequestError("Invalid", { field: "email" });

    expect(error.extra).toEqual({ field: "email" });
  });
});

describe("UnauthorizedError", () => {
  it("should create 401 error", () => {
    const error = new UnauthorizedError();

    expect(error.message).toBe("Unauthorized");
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.expose).toBe(true);
  });
});

describe("ForbiddenError", () => {
  it("should create 403 error", () => {
    const error = new ForbiddenError();

    expect(error.message).toBe("Forbidden");
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.expose).toBe(true);
  });
});

describe("NotFoundError", () => {
  it("should create 404 error", () => {
    const error = new NotFoundError();

    expect(error.message).toBe("Not Found");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.expose).toBe(true);
  });

  it("should create 404 error with custom message", () => {
    const error = new NotFoundError("User not found");

    expect(error.message).toBe("User not found");
  });
});

describe("ConflictError", () => {
  it("should create 409 error", () => {
    const error = new ConflictError();

    expect(error.message).toBe("Conflict");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
    expect(error.expose).toBe(true);
  });
});

describe("UnprocessableEntityError", () => {
  it("should create 422 error", () => {
    const error = new UnprocessableEntityError();

    expect(error.message).toBe("Unprocessable Entity");
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe("UNPROCESSABLE_ENTITY");
    expect(error.expose).toBe(true);
  });
});

describe("TooManyRequestsError", () => {
  it("should create 429 error", () => {
    const error = new TooManyRequestsError();

    expect(error.message).toBe("Too Many Requests");
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe("TOO_MANY_REQUESTS");
    expect(error.expose).toBe(true);
  });
});
