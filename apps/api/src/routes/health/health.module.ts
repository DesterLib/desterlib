import { Router, type Router as RouterType } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { healthController } from "./health.controller.js";

const router: RouterType = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check
 *     description: Basic health check endpoint
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get("/", asyncHandler(healthController.health.bind(healthController)));

/**
 * @openapi
 * /health/ready:
 *   get:
 *     summary: Readiness check
 *     description: Checks if service and all dependencies are ready
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get(
  "/ready",
  asyncHandler(healthController.ready.bind(healthController))
);

/**
 * @openapi
 * /health/live:
 *   get:
 *     summary: Liveness check
 *     description: Checks if the process is alive
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Process is alive
 */
router.get("/live", asyncHandler(healthController.live.bind(healthController)));

export default router;
