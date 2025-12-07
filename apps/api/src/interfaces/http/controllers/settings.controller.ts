import type { Request, Response } from "express";
import { UpdateSettingsRequest } from "../schemas/settings.schema";
import { settingsService } from "../../../app/settings";
import { asyncHandler } from "../../../infrastructure/utils/async-handler";
import { sendSuccess } from "../utils/response.helpers";

export const settingsControllers = {
  /**
   * Get application settings (excludes sensitive data)
   */
  get: asyncHandler(async (req: Request, res: Response) => {
    const publicSettings = await settingsService.get();
    return sendSuccess(res, publicSettings);
  }),

  /**
   * Update application settings
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = req.validatedData as UpdateSettingsRequest;

    // Update only the fields that were provided
    const updatedSettings = await settingsService.update(validatedData);

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
    await settingsService.completeFirstRun();

    return sendSuccess(res, null, 200, "First run setup completed");
  }),

  /**
   * Reset all settings to defaults
   */
  resetAll: asyncHandler(async (req: Request, res: Response) => {
    const updatedSettings = await settingsService.resetAll();

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
    const updatedSettings = await settingsService.resetScanSettings();

    return sendSuccess(
      res,
      updatedSettings,
      200,
      "Scan settings reset to defaults"
    );
  }),
};
