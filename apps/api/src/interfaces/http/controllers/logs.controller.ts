import type { Request, Response } from "express";
import { logsService } from "../../../app/logs";
import { logger } from "@dester/logger";
import type { GetLogsQuery } from "../schemas/logs.schema";

/**
 * Async handler wrapper for error handling
 */
function asyncHandler(
  fn: (req: Request, res: Response, next: any) => Promise<any>
) {
  return (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Send success response
 */
function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): Response {
  const response: {
    success: true;
    data?: T;
    message?: string;
  } = {
    success: true,
  };

  if (data !== null && data !== undefined) {
    response.data = data;
  }

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
}

/**
 * Get recent logs
 */
export const getLogs = asyncHandler(async (req: Request, res: Response) => {
  const { limit = 100, level } = req.validatedData as GetLogsQuery;

  const logs = await logsService.getRecentLogs(limit, level);

  return sendSuccess(res, logs);
});

/**
 * Clear logs
 */
export const clearLogs = asyncHandler(async (req: Request, res: Response) => {
  await logsService.clearLogs();

  return sendSuccess(res, null, 200, "Logs cleared successfully");
});
