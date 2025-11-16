import express, { Router } from "express";
import { readFileSync } from "fs";
import { join } from "path";

const router: Router = express.Router();

// Read version from package.json
const getApiVersion = (): string => {
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, "../../package.json"), "utf-8"),
    );
    return packageJson.version;
  } catch (error) {
    return "unknown";
  }
};

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current status of the API including version information
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 */
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    version: getApiVersion(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
