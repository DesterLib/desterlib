import type { Request, Response, NextFunction } from "express";
import { SettingsService } from "./settings.service.js";
import { AppError } from "../../lib/errors.js";

const settingsService = new SettingsService();

export class SettingsController {
  /**
   * GET /api/settings
   * Get current settings
   */
  async getSettings(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const settings = await settingsService.getSettings();
      res.jsonOk({ settings });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to get settings", { cause: error }));
      }
    }
  }

  /**
   * GET /api/settings/setup-status
   * Check if initial setup is complete
   */
  async getSetupStatus(
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const isComplete = await settingsService.isSetupComplete();
      res.jsonOk({ isSetupComplete: isComplete });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to check setup status", { cause: error }));
      }
    }
  }

  /**
   * POST /api/settings/complete-setup
   * Complete initial setup
   */
  async completeSetup(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const config = req.body;
      const settings = await settingsService.completeSetup(config);
      res.jsonOk({ settings });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to complete setup", { cause: error }));
      }
    }
  }

  /**
   * PATCH /api/settings
   * Update settings
   */
  async updateSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const config = req.body;
      const settings = await settingsService.updateSettings(config);
      res.jsonOk({ settings });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to update settings", { cause: error }));
      }
    }
  }
}

// Export singleton instance
export const settingsController = new SettingsController();
