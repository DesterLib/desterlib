import express, { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import axios from "axios";
import { config } from "../../../config/env";
import { logger } from "@dester/logger";
import { container } from "../../../infrastructure/container";

const router: Router = express.Router();

function getApiVersion(): string {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, "../../../../package.json"), "utf-8")
    );
    return packageJson.version;
  } catch (error) {
    return "unknown";
  }
}

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the API server and downstream services
 *     tags: [Health]
 *     responses:
 *       '200':
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get("/health", async (req, res) => {
  let metadataPluginStatus = "unknown";
  let scannerServiceStatus = "unknown";

  // Check plugin status
  try {
    const pluginManager = container.getPluginManager();
    const tmdbPlugin = pluginManager.getPlugin("tmdb");

    if (tmdbPlugin) {
      const pluginStatus = tmdbPlugin.getStatus();
      metadataPluginStatus =
        pluginStatus.status === "running" ? "healthy" : "unhealthy";
    } else {
      metadataPluginStatus = "not_loaded";
    }
  } catch (error) {
    logger.debug({ error }, "Failed to check plugin status");
    metadataPluginStatus = "unknown";
  }

  // Non-blocking check for scanner service
  const checkService = async (url: string): Promise<string> => {
    try {
      await axios.get(`${url}/health`, { timeout: 1000 });
      return "healthy";
    } catch (error) {
      return "unreachable";
    }
  };

  try {
    scannerServiceStatus = await checkService(config.scannerServiceUrl);
  } catch (error) {
    logger.error({ error }, "Failed to check scanner service");
  }

  // Determine overall status
  // If API is up, we return 200, even if downstream services are down.
  // The 'services' object details the partial outages.
  res.status(200).json({
    status: "OK",
    version: getApiVersion(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      metadata_plugin: metadataPluginStatus,
      scanner_service: scannerServiceStatus,
    },
  });
});

export default router;
