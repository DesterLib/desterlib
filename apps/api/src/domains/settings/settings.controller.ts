import { Request, Response } from "express";
import { settingsManager } from "../../core/config/settings";
import { sendSuccess, asyncHandler } from "../../lib/utils";
import { UpdateSettingsRequest } from "./settings.schema";

export const settingsControllers = {
  /**
   * Get application settings (excludes sensitive data)
   */
  get: asyncHandler(async (req: Request, res: Response) => {
    const publicSettings = await settingsManager.getPublicSettings();
    return sendSuccess(res, publicSettings);
  }),

  /**
   * Update application settings
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = req.validatedData as UpdateSettingsRequest;

    // Update only the fields that were provided
    await settingsManager.updateSettings(validatedData);

    const updatedSettings = await settingsManager.getPublicSettings();

    return sendSuccess(
      res,
      updatedSettings,
      200,
      "Settings updated successfully"
    );
  }),

  /**
   * Complete first run setup
   */
  completeFirstRun: asyncHandler(async (req: Request, res: Response) => {
    await settingsManager.completeFirstRun();

    return sendSuccess(res, null, 200, "First run setup completed");
  }),

  /**
   * Reset all settings to defaults
   */
  resetAll: asyncHandler(async (req: Request, res: Response) => {
    await settingsManager.resetAllSettings();

    const updatedSettings = await settingsManager.getPublicSettings();

    return sendSuccess(
      res,
      updatedSettings,
      200,
      "All settings reset to defaults"
    );
  }),

  /**
   * Reset scan settings to defaults
   */
  resetScanSettings: asyncHandler(async (req: Request, res: Response) => {
    await settingsManager.resetScanSettings();

    const updatedSettings = await settingsManager.getPublicSettings();

    return sendSuccess(
      res,
      updatedSettings,
      200,
      "Scan settings reset to defaults"
    );
  }),
};
