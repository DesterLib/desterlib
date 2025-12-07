import type { Request, Response } from "express";

/**
 * Send success response
 * Standardizes API success responses across all controllers
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): Response {
  const response: {
    success: true;
    data: T;
    message?: string;
  } = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
}

/**
 * Get base URL from request
 * Extracts the base URL (protocol + host) from the Express request
 */
export function getBaseUrl(req: Request): string {
  const protocol = req.protocol;
  const host = req.get("host") || "localhost:3001";
  return `${protocol}://${host}`;
}
