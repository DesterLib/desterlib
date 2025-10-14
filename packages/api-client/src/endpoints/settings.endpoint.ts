import { BaseEndpoint } from "./base.endpoint.js";
import {
  SettingsResponseSchema,
  SetupStatusResponseSchema,
  type SettingsResponse,
  type SetupStatusResponse,
  type Settings,
} from "../schemas/settings.schemas.js";

/**
 * Settings endpoint module
 *
 * @example
 * ```ts
 * const settings = await api.settings.get();
 * const status = await api.settings.getSetupStatus();
 * await api.settings.update({ tmdbApiKey: 'your-key' });
 * ```
 */
export class SettingsEndpoint extends BaseEndpoint {
  /**
   * Get current settings
   *
   * @returns Current settings
   */
  async get(): Promise<SettingsResponse> {
    return this.client.get("/api/settings", SettingsResponseSchema);
  }

  /**
   * Update settings
   *
   * @param settings - Settings to update
   * @returns Updated settings
   */
  async update(
    settings: Partial<
      Omit<Settings, "id" | "createdAt" | "updatedAt" | "libraries">
    >
  ): Promise<SettingsResponse> {
    return this.client.put("/api/settings", settings, SettingsResponseSchema);
  }

  /**
   * Get setup status
   *
   * @returns Setup status
   */
  async getSetupStatus(): Promise<SetupStatusResponse> {
    return this.client.get(
      "/api/settings/setup-status",
      SetupStatusResponseSchema
    );
  }
}
