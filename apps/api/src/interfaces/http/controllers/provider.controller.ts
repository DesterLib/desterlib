import type { Request, Response } from "express";
import axios from "axios";
import { providerService } from "../../../app/providers";
import { config } from "../../../config/env";
import { logger } from "@dester/logger";

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

/**
 * Helper function to reload providers in the metadata service
 * This is called automatically after provider changes to ensure
 * the metadata service picks up new providers without needing a restart.
 * Errors are logged but don't fail the operation.
 */
export async function reloadProvidersInMetadataService(): Promise<void> {
  try {
    await axios.post(
      `${config.metadataServiceUrl}/providers/reload`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000, // 10 second timeout
      }
    );
    logger.info("Metadata service providers reloaded successfully");
  } catch (error: any) {
    // Log error but don't throw - provider operation should succeed
    // even if metadata service is temporarily unavailable
    if (error.response) {
      logger.warn(
        { status: error.response.status, error: error.response.data },
        "Failed to reload providers in metadata service (service returned error)"
      );
    } else if (error.request) {
      logger.warn(
        "Failed to reload providers in metadata service (service unavailable). Provider will be available after metadata service restart."
      );
    } else {
      logger.warn(
        { error },
        "Failed to reload providers in metadata service (unexpected error)"
      );
    }
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
    const name = req.params.name;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        error: "Provider name is required",
      });
    }

    const provider = await providerService.getProvider(name);

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: "Provider not found",
      });
    }

    return sendSuccess(res, provider);
  }),

  /**
   * Create or update a provider
   */
  upsert: asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name || req.body.name;
    const { enabled, priority, config } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        error: "Provider name is required",
      });
    }

    const provider = await providerService.upsertProvider(
      name,
      enabled ?? true,
      priority ?? 0,
      config ?? {}
    );

    // Reload providers in metadata service to pick up the new/updated provider
    await reloadProvidersInMetadataService();

    return sendSuccess(res, provider, 200, "Provider configured successfully");
  }),

  /**
   * Update a provider
   */
  update: asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;
    const { enabled, priority, config } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        error: "Provider name is required",
      });
    }

    const provider = await providerService.updateProvider(name, {
      enabled,
      priority,
      config,
    });

    if (!provider) {
      return res.status(404).json({
        success: false,
        error: "Provider not found",
      });
    }

    // Reload providers in metadata service to pick up the updated provider
    await reloadProvidersInMetadataService();

    return sendSuccess(res, provider, 200, "Provider updated successfully");
  }),

  /**
   * Delete a provider
   */
  delete: asyncHandler(async (req: Request, res: Response) => {
    const name = req.params.name;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        error: "Provider name is required",
      });
    }

    const deleted = await providerService.deleteProvider(name);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: "Provider not found",
      });
    }

    // Reload providers in metadata service to remove the deleted provider
    await reloadProvidersInMetadataService();

    return sendSuccess(res, null, 200, "Provider deleted successfully");
  }),

  /**
   * Reload providers in the metadata service
   */
  reload: asyncHandler(async (req: Request, res: Response) => {
    try {
      const response = await axios.post(
        `${config.metadataServiceUrl}/providers/reload`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      return sendSuccess(
        res,
        response.data,
        response.status,
        response.data.message || "Providers reloaded successfully"
      );
    } catch (error: any) {
      logger.error({ error }, "Failed to reload providers in metadata service");

      // Handle axios errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        return res.status(error.response.status).json({
          success: false,
          error: error.response.data?.error || "Failed to reload providers",
        });
      } else if (error.request) {
        // The request was made but no response was received
        return res.status(503).json({
          success: false,
          error:
            "Metadata service unavailable. Make sure the metadata service is running.",
        });
      } else {
        // Something happened in setting up the request
        return res.status(500).json({
          success: false,
          error: "Internal server error",
        });
      }
    }
  }),
};
