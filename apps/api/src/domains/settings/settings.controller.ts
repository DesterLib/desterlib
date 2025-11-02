import { Request, Response } from "express";
import { settingsManager, UserSettings } from "../../core/config/settings";
import { sendSuccess, asyncHandler } from "../../lib/utils";
import { UpdateSettingsRequest } from "./settings.types";

export const settingsControllers = {
  /**
   * Get application settings (excludes sensitive data)
   */
  get: asyncHandler(async (req: Request, res: Response) => {
    const settings = await settingsManager.getSettings();

    // Don't return sensitive information like jwtSecret
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { jwtSecret: _, ...publicSettings } = settings;

    return sendSuccess(res, publicSettings);
  }),

  /**
   * Update application settings
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = req.validatedData as UpdateSettingsRequest;

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

    return sendSuccess(res, publicSettings, 200, "Settings updated successfully");
  }),

  /**
   * Complete first run setup
   */
  completeFirstRun: asyncHandler(async (req: Request, res: Response) => {
    await settingsManager.completeFirstRun();

    return sendSuccess(res, null, 200, "First run setup completed");
  }),
};
