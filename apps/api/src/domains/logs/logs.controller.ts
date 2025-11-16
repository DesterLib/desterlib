import { Request, Response } from "express";
import { logsServices } from "./logs.services";
import { logger } from "@/lib/utils";

/**
 * Get recent logs
 * @route GET /api/v1/logs
 */
export const getLogs = async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const level = req.query.level as string | undefined;

    const logs = await logsServices.getRecentLogs(limit, level);

    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (error) {
    logger.error("Error fetching logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch logs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Clear logs
 * @route DELETE /api/v1/logs
 */
export const clearLogs = async (req: Request, res: Response) => {
  try {
    await logsServices.clearLogs();

    res.status(200).json({
      success: true,
      message: "Logs cleared successfully",
    });
  } catch (error) {
    logger.error("Error clearing logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear logs",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

