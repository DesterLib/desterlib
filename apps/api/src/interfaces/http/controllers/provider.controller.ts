import type { Request, Response } from "express";
import { providerService } from "../../../app/providers";
import { container } from "../../../infrastructure/container";
import { logger } from "@dester/logger";
import { asyncHandler } from "../../../infrastructure/utils/async-handler";
import { sendSuccess } from "../utils/response.helpers";
import {
  hasReloadProviders,
  type IPluginWithReloadProviders,
} from "../../../infrastructure/plugins/plugin-extensions";
import {
  getProviderByNameSchema,
  upsertProviderSchema,
  updateProviderSchema,
  deleteProviderSchema,
} from "../schemas/provider.schema";
import type { z } from "zod";
import { NotFoundError } from "../../../infrastructure/utils/errors";
import type { Prisma } from "@prisma/client";

type GetProviderByNameRequest = z.infer<typeof getProviderByNameSchema>;
type UpsertProviderRequest = z.infer<typeof upsertProviderSchema>;
type UpdateProviderRequest = z.infer<typeof updateProviderSchema>;
type DeleteProviderRequest = z.infer<typeof deleteProviderSchema>;

/**
 * Helper function to reload providers in the plugin
 * This is called automatically after provider changes to ensure
 * the plugin picks up new providers without needing a restart.
 * Errors are logged but don't fail the operation.
 */
export async function reloadProvidersInMetadataService(): Promise<void> {
  try {
    const pluginManager = container.getPluginManager();
    const tmdbPlugin = pluginManager.getPlugin("tmdb");

    if (hasReloadProviders(tmdbPlugin)) {
      await tmdbPlugin.reloadProviders();
      logger.info("TMDB plugin providers reloaded successfully");
    } else {
      logger.warn("TMDB plugin not found or does not support reloadProviders");
    }
  } catch (error: unknown) {
    // Log error but don't throw - provider operation should succeed
    // even if plugin is temporarily unavailable
    logger.warn(
      { error },
      "Failed to reload providers in TMDB plugin (non-critical)"
    );
  }
}

export const providerControllers = {
  /**
   * Get all metadata providers
   */
  getAll: asyncHandler(async (req: Request, res: Response) => {
    const providers = await providerService.getProviders();
    return sendSuccess(res, providers);
  }),

  /**
   * Get enabled providers
   */
  getEnabled: asyncHandler(async (req: Request, res: Response) => {
    const providers = await providerService.getEnabledProviders();
    return sendSuccess(res, providers);
  }),

  /**
   * Get a specific provider by name
   */
  getByName: asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.validatedData as GetProviderByNameRequest;

    const provider = await providerService.getProvider(name);

    if (!provider) {
      throw new NotFoundError("Provider", name);
    }

    return sendSuccess(res, provider);
  }),

  /**
   * Create or update a provider
   */
  upsert: asyncHandler(async (req: Request, res: Response) => {
    const validatedData = req.validatedData as UpsertProviderRequest;
    const name = req.params.name || validatedData.name;

    if (!name) {
      throw new Error("Provider name is required");
    }

    const provider = await providerService.upsertProvider(
      name,
      validatedData.enabled ?? true,
      validatedData.priority ?? 0,
      (validatedData.config ?? {}) as Prisma.InputJsonValue
    );

    // Reload providers in metadata service to pick up the new/updated provider
    await reloadProvidersInMetadataService();

    return sendSuccess(res, provider, 200, "Provider configured successfully");
  }),

  /**
   * Update a provider
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.validatedData as UpdateProviderRequest;
    const validatedData = req.validatedData as UpdateProviderRequest;

    const provider = await providerService.updateProvider(name, {
      enabled: validatedData.enabled,
      priority: validatedData.priority,
      config: validatedData.config as Prisma.InputJsonValue | undefined,
    });

    if (!provider) {
      throw new NotFoundError("Provider", name);
    }

    // Reload providers in metadata service to pick up the updated provider
    await reloadProvidersInMetadataService();

    return sendSuccess(res, provider, 200, "Provider updated successfully");
  }),

  /**
   * Delete a provider
   */
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.validatedData as DeleteProviderRequest;

    const deleted = await providerService.deleteProvider(name);

    if (!deleted) {
      throw new NotFoundError("Provider", name);
    }

    // Reload providers in metadata service to remove the deleted provider
    await reloadProvidersInMetadataService();

    return sendSuccess(res, null, 200, "Provider deleted successfully");
  }),

  /**
   * Reload providers in the TMDB plugin
   */
  reload: asyncHandler(async (req: Request, res: Response) => {
    try {
      const pluginManager = container.getPluginManager();
      const tmdbPlugin = pluginManager.getPlugin("tmdb");

      if (!tmdbPlugin) {
        return res.status(503).json({
          success: false,
          error: "TMDB plugin not found or not loaded",
        });
      }

      if (hasReloadProviders(tmdbPlugin)) {
        await tmdbPlugin.reloadProviders();
        return sendSuccess(
          res,
          { provider: "tmdb" },
          200,
          "Providers reloaded successfully"
        );
      } else {
        return res.status(503).json({
          success: false,
          error: "TMDB plugin does not support reloadProviders",
        });
      }
    } catch (error: unknown) {
      logger.error({ error }, "Failed to reload providers in TMDB plugin");
      const errorMessage =
        error instanceof Error ? error.message : "Internal server error";
      return res.status(500).json({
        success: false,
        error: errorMessage,
      });
    }
  }),
};
