import type { Request, Response } from "express";
import { logsService } from "../../../app/logs";
import { logger } from "@dester/logger";
import type { GetLogsQuery } from "../schemas/logs.schema";
import { asyncHandler } from "../../../infrastructure/utils/async-handler";
import { sendSuccess } from "../utils/response.helpers";

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
