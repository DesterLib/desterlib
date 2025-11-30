import { settingsManager } from "../../infrastructure/core/settings";
import type { PublicSettings } from "../../domain/entities/settings";

export const settingsService = {
  get: async (): Promise<PublicSettings> => {
    return await settingsManager.getPublicSettings();
  },

  update: async (updates: Partial<PublicSettings>): Promise<PublicSettings> => {
    await settingsManager.updateSettings(updates);
    return await settingsManager.getPublicSettings();
  },

  completeFirstRun: async (): Promise<void> => {
    await settingsManager.completeFirstRun();
  },

  resetAll: async (): Promise<PublicSettings> => {
    await settingsManager.resetAllSettings();
    return await settingsManager.getPublicSettings();
  },

  resetScanSettings: async (): Promise<PublicSettings> => {
    await settingsManager.resetScanSettings();
    return await settingsManager.getPublicSettings();
  },
};
