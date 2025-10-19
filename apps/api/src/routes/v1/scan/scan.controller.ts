import { Request, Response } from "express";
import { scanServices } from "./scan.services";
import { scanPathSchema } from "./scan.schema";
import { config } from "../../../config/env";
import { z } from "zod";
import { logger } from "@/lib/utils";
import { wsManager } from "@/lib/websocket";

type ScanPathRequest = z.infer<typeof scanPathSchema>;

export const scanPathController = async (req: Request, res: Response) => {
  try {
    const validatedData = req.validatedData as ScanPathRequest;

    if (!validatedData) {
      return res.status(400).json({
        error: "Validation failed",
        message: "Request data is missing or invalid",
      });
    }

    const { path, options } = validatedData;

    // Use TMDB API key from environment variables
    const finalOptions = {
      ...options,
      tmdbApiKey: config.tmdbApiKey,
    };

    // Call the scanning service
    const mediaEntries = await scanServices.post(path, finalOptions);

    return res.status(200).json({
      success: true,
      path,
      results: {
        totalFiles: mediaEntries.length,
        entries: mediaEntries,
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to scan path";
    logger.error(`Scan path controller error: ${errorMessage}`);

    // Send error via WebSocket
    wsManager.sendScanError({
      error: errorMessage,
    });

    return res.status(500).json({
      error: "Internal server error",
      message: errorMessage,
    });
  }
};
