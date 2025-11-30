import type { Request, Response } from "express";
import { UpdateSettingsRequest } from "../schemas/settings.schema";
import { settingsService } from "../../../app/settings";

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
