import { Request, Response } from "express";
import { settingsManager, UserSettings } from "../../core/config/settings";
import { logger } from "../../lib/utils";
import { UpdateSettingsRequest } from "./settings.types";

export const settingsControllers = {
  get: async (req: Request, res: Response) => {
    try {
      const settings = await settingsManager.getSettings();

      // Don't return sensitive information like jwtSecret
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { jwtSecret: _, ...publicSettings } = settings;

      return res.status(200).json({
        success: true,
        settings: publicSettings,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to get settings";
      logger.error(`Get settings error: ${errorMessage}`);

      return res.status(500).json({
        error: "Internal server error",
        message: errorMessage,
      });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const validatedData = req.validatedData as UpdateSettingsRequest;

      if (!validatedData) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Request data is missing or invalid",
        });
      }

      const updates: Partial<UserSettings> = {};

      if (validatedData.tmdbApiKey !== undefined) {
        updates.tmdbApiKey = validatedData.tmdbApiKey;
      }

      if (validatedData.port !== undefined) {
        updates.port = validatedData.port;
      }

      if (validatedData.enableRouteGuards !== undefined) {
        updates.enableRouteGuards = validatedData.enableRouteGuards;
      }

      await settingsManager.updateSettings(updates);

      const updatedSettings = await settingsManager.getSettings();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { jwtSecret: _, ...publicSettings } = updatedSettings;

      return res.status(200).json({
        success: true,
        message: "Settings updated successfully",
        settings: publicSettings,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update settings";
      logger.error(`Update settings error: ${errorMessage}`);

      return res.status(500).json({
        error: "Internal server error",
        message: errorMessage,
      });
    }
  },

  completeFirstRun: async (req: Request, res: Response) => {
    try {
      await settingsManager.completeFirstRun();

      return res.status(200).json({
        success: true,
        message: "First run setup completed",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to complete first run setup";
      logger.error(`Complete first run error: ${errorMessage}`);

      return res.status(500).json({
        error: "Internal server error",
        message: errorMessage,
      });
    }
  },
};
