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
};
