import express from "express";
import { config } from "../../../config/env";
import { logger } from "@dester/logger";
import {
  ApiError,
  ValidationError,
} from "../../../infrastructure/utils/errors";

export const notFoundHandler = (
  req: express.Request,
  res: express.Response
) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (
  error: Error,
  req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  if (error instanceof ApiError) {
    logger.error(`API Error: ${error.message}`, {
      statusCode: error.statusCode,
      errorType: error.errorType,
      path: req.path,
      method: req.method,
    });

    const response: {
      success: false;
      error: string;
      message: string;
      details?: unknown[];
      stack?: string;
    } = {
      success: false,
      error: error.errorType,
      message: error.message,
    };

    if (error instanceof ValidationError && error.details) {
      response.details = error.details;
    }

    if (config.nodeEnv !== "production") {
      response.stack = error.stack;
    }

    return res.status(error.statusCode).json(response);
  }

  logger.error(`Unhandled error: ${error.message}`, {
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: "Internal server error",
    message:
      config.nodeEnv === "production"
        ? "An unexpected error occurred"
        : error.message,
    ...(config.nodeEnv !== "production" && { stack: error.stack }),
  });
};

export function setupErrorHandling(app: express.Application) {
  app.use("*", notFoundHandler);
  app.use(errorHandler);
}
