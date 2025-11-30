import express, { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";
import axios from "axios";
import { config } from "../../../config/env";
import { logger } from "@dester/logger";

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
  let metadataServiceStatus = "unknown";
  let scannerServiceStatus = "unknown";

  // Non-blocking checks for downstream services
  // We use a short timeout to ensure the main API health check remains fast
  const checkService = async (url: string): Promise<string> => {
    try {
      await axios.get(`${url}/health`, { timeout: 1000 });
      return "healthy";
    } catch (error) {
      return "unreachable";
    }
  };

  try {
    const [metadataStatus, scannerStatus] = await Promise.all([
      checkService(config.metadataServiceUrl),
      checkService(config.scannerServiceUrl),
    ]);

    metadataServiceStatus = metadataStatus;
    scannerServiceStatus = scannerStatus;
  } catch (error) {
    logger.error({ error }, "Failed to check downstream services");
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
      metadata_service: metadataServiceStatus,
      scanner_service: scannerServiceStatus,
    },
  });
});

export default router;
