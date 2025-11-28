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
 *         scanSettings:
 *           type: object
 *           description: Default scan configuration options
 *           properties:
 *             mediaType:
 *               type: string
 *               enum: [movie, tv]
 *               description: Type of media to scan (movie or tv)
 *             maxDepth:
 *               type: number
 *               minimum: 0
 *               maximum: 10
 *               description: Maximum directory depth to scan
 *             mediaTypeDepth:
 *               type: object
 *               properties:
 *                 movie:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 10
 *                 tv:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 10
 *             fileExtensions:
 *               type: array
 *               items:
 *                 type: string
 *               maxItems: 20
 *               description: File extensions to include in the scan
 *             filenamePattern:
 *               type: string
 *               description: Regex pattern to match filenames
 *             excludePattern:
 *               type: string
 *               description: Regex pattern to exclude files/directories
 *             includePattern:
 *               type: string
 *               description: Regex pattern to include files/directories
 *             directoryPattern:
 *               type: string
 *               description: Regex pattern to match directory names
 *             excludeDirectories:
 *               type: array
 *               items:
 *                 type: string
 *               maxItems: 50
 *               description: List of directory names to exclude
 *             includeDirectories:
 *               type: array
 *               items:
 *                 type: string
 *               maxItems: 50
 *               description: List of directory names to include
 *             rescan:
 *               type: boolean
 *               description: Re-fetch metadata even if it already exists
 *             batchScan:
 *               type: boolean
 *               description: Enable batch scanning mode for large libraries
 *             minFileSize:
 *               type: number
 *               minimum: 0
 *               description: Minimum file size in bytes
 *             maxFileSize:
 *               type: number
 *               minimum: 0
 *               description: Maximum file size in bytes
 *             followSymlinks:
 *               type: boolean
 *               description: Whether to follow symbolic links during scanning
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
 *         scanSettings:
 *           type: object
 *           description: Default scan configuration options
 *           properties:
 *             mediaType:
 *               type: string
 *               enum: [movie, tv]
 *             maxDepth:
 *               type: number
 *               minimum: 0
 *               maximum: 10
 *             mediaTypeDepth:
 *               type: object
 *               properties:
 *                 movie:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 10
 *                 tv:
 *                   type: number
 *                   minimum: 0
 *                   maximum: 10
 *             fileExtensions:
 *               type: array
 *               items:
 *                 type: string
 *               maxItems: 20
 *             filenamePattern:
 *               type: string
 *             excludePattern:
 *               type: string
 *             includePattern:
 *               type: string
 *             directoryPattern:
 *               type: string
 *             excludeDirectories:
 *               type: array
 *               items:
 *                 type: string
 *               maxItems: 50
 *             includeDirectories:
 *               type: array
 *               items:
 *                 type: string
 *               maxItems: 50
 *             rescan:
 *               type: boolean
 *             batchScan:
 *               type: boolean
 *             minFileSize:
 *               type: number
 *               minimum: 0
 *             maxFileSize:
 *               type: number
 *               minimum: 0
 *             followSymlinks:
 *               type: boolean
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
 *             updateScanSettings:
 *               summary: Update scan settings
 *               value:
 *                 scanSettings:
 *                   mediaType: "tv"
 *                   maxDepth: 4
 *                   fileExtensions: [".mkv", ".mp4"]
 *                   followSymlinks: true
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
  settingsControllers.update
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

/**
 * @swagger
 * /api/v1/settings/reset:
 *   post:
 *     summary: Reset all settings to defaults
 *     description: Reset all application settings to their default values
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: All settings reset successfully
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
 *                   example: "All settings reset to defaults"
 *                 data:
 *                   $ref: '#/components/schemas/PublicSettings'
 *       500:
 *         description: Internal server error
 */
router.post("/reset", settingsControllers.resetAll);

/**
 * @swagger
 * /api/v1/settings/reset-scan:
 *   post:
 *     summary: Reset scan settings to defaults
 *     description: Reset only the scan settings to their default values
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Scan settings reset successfully
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
 *                   example: "Scan settings reset to defaults"
 *                 data:
 *                   $ref: '#/components/schemas/PublicSettings'
 *       500:
 *         description: Internal server error
 */
router.post("/reset-scan", settingsControllers.resetScanSettings);

export default router;
