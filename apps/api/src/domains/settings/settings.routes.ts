import { Router } from "express";
import { settingsControllers } from "./settings.controller";
import { validate } from "../../lib/middleware";
import { updateSettingsSchema, getSettingsSchema } from "./settings.schema";

const router: Router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PublicSettings:
 *       type: object
 *       properties:
 *         tmdbApiKey:
 *           type: string
 *           description: The Movie Database (TMDB) API key for fetching metadata
 *           example: "your-tmdb-api-key-here"
 *         port:
 *           type: number
 *           description: Server port number
 *           minimum: 1000
 *           maximum: 65535
 *           example: 3001
 *         enableRouteGuards:
 *           type: boolean
 *           description: Whether to enable authentication route guards
 *           example: false
 *         firstRun:
 *           type: boolean
 *           description: Indicates if this is the first run of the application
 *           example: true
 *
 *     UpdateSettingsRequest:
 *       type: object
 *       properties:
 *         tmdbApiKey:
 *           type: string
 *           description: The Movie Database (TMDB) API key
 *         port:
 *           type: number
 *           minimum: 1000
 *           maximum: 65535
 *           description: Server port number
 *         enableRouteGuards:
 *           type: boolean
 *           description: Enable/disable authentication route guards
 *         firstRun:
 *           type: boolean
 *           description: Whether this is the first run (usually managed via /first-run-complete)
 */

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Get application settings
 *     description: Retrieve current application settings (excludes sensitive data like jwtSecret)
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PublicSettings'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   example: "Failed to fetch settings"
 */
router.get("/", validate(getSettingsSchema, "query"), settingsControllers.get);

/**
 * @swagger
 * /api/v1/settings:
 *   put:
 *     summary: Update application settings
 *     description: Update one or more application settings
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSettingsRequest'
 *           examples:
 *             updateTmdbKey:
 *               summary: Update TMDB API key
 *               value:
 *                 tmdbApiKey: "your-new-tmdb-api-key"
 *             updatePort:
 *               summary: Update server port
 *               value:
 *                 port: 3002
 *             updateMultiple:
 *               summary: Update multiple settings
 *               value:
 *                 tmdbApiKey: "your-tmdb-key"
 *                 enableRouteGuards: true
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Settings updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/PublicSettings'
 *       400:
 *         description: Invalid request body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 message:
 *                   type: string
 *                   example: "Invalid input data"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   example: "Failed to update settings"
 */
router.put(
  "/",
  validate(updateSettingsSchema, "body"),
  settingsControllers.update,
);

/**
 * @swagger
 * /api/v1/settings/first-run-complete:
 *   post:
 *     summary: Complete first run setup
 *     description: Mark the application's first run setup as completed
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: First run setup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "First run setup completed"
 *                 data:
 *                   type: null
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   example: "Failed to complete first run setup"
 */
router.post("/first-run-complete", settingsControllers.completeFirstRun);

export default router;
