import express, { Router } from "express";
import { settingsControllers } from "../../controllers/settings.controller";
import { providerControllers } from "../../controllers/provider.controller";
import { validate } from "../../middleware";
import {
  updateSettingsSchema,
  getSettingsSchema,
} from "../../schemas/settings.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Get application settings
 *     description: Retrieves the current application settings. Sensitive data (like API keys) is excluded from the response for security.
 *     tags: [Settings]
 *     parameters:
 *       - in: query
 *         name: includePrivate
 *         schema:
 *           type: boolean
 *         description: Include private settings in response (not recommended for security)
 *     responses:
 *       '200':
 *         description: Application settings (public settings only)
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
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 *   put:
 *     summary: Update application settings
 *     description: Updates application settings with new values. You can update individual settings or multiple settings at once.
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSettingsRequest'
 *           examples:
 *             updateTmdbApiKey:
 *               summary: Update TMDB API Key
 *               description: Set or update the TMDB (The Movie Database) API key for metadata fetching. This automatically syncs to the metadata provider system and enables the TMDB provider. You can also manage providers directly via the /providers endpoints.
 *               value:
 *                 tmdbApiKey: "your_tmdb_api_key_here"
 *             updateScanSettings:
 *               summary: Update scan settings
 *               description: Update media scanning configuration with media-type-specific patterns
 *               value:
 *                 scanSettings:
 *                   mediaTypeDepth:
 *                     movie: 2
 *                     tv: 4
 *                   mediaTypePatterns:
 *                     movie:
 *                       filenamePattern: ".*\\.(mkv|mp4|avi)$"
 *                       directoryPattern: "^[^\\/]+(?:\\s*\\(\\d{4}\\))?$"
 *                     tv:
 *                       filenamePattern: ".*[Ss]\\d{2}[Ee]\\d{2}.*\\.(mkv|mp4)$"
 *                       directoryPattern: "^(?:[^\\/]+|Season\\s*\\d+)$"
 *                   rescan: false
 *                   followSymlinks: true
 *             updateMultiple:
 *               summary: Update multiple settings
 *               description: Update multiple settings at once
 *               value:
 *                 tmdbApiKey: "your_tmdb_api_key_here"
 *                 scanSettings:
 *                   mediaTypeDepth:
 *                     movie: 2
 *                     tv: 4
 *                   mediaTypePatterns:
 *                     movie:
 *                       filenamePattern: ".*\\.(mkv|mp4|avi)$"
 *     responses:
 *       '200':
 *         description: Settings updated successfully
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
 *                 message:
 *                   type: string
 *                   example: "Settings updated successfully"
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/", validate(getSettingsSchema, "query"), settingsControllers.get);

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
 *     description: Marks the first run setup as complete
 *     tags: [Settings]
 *     responses:
 *       '200':
 *         description: First run setup completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/first-run-complete", settingsControllers.completeFirstRun);

/**
 * @swagger
 * /api/v1/settings/reset:
 *   post:
 *     summary: Reset all settings to defaults
 *     description: Resets all application settings to their default values
 *     tags: [Settings]
 *     responses:
 *       '200':
 *         description: Settings reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/reset", settingsControllers.resetAll);

/**
 * @swagger
 * /api/v1/settings/reset-scan:
 *   post:
 *     summary: Reset scan settings to defaults
 *     description: Resets only the scan-related settings to their default values
 *     tags: [Settings]
 *     responses:
 *       '200':
 *         description: Scan settings reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/reset-scan", settingsControllers.resetScanSettings);

/**
 * @swagger
 * /api/v1/settings/providers:
 *   get:
 *     summary: Get all metadata providers
 *     description: Retrieves all configured metadata providers (enabled and disabled)
 *     tags: [Settings]
 *     responses:
 *       '200':
 *         description: List of metadata providers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/MetadataProvider'
 *   post:
 *     summary: Create or update a metadata provider
 *     description: Creates a new metadata provider or updates an existing one
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "tmdb"
 *                 description: "Provider name (e.g., 'tmdb', 'omdb', 'tvdb')"
 *               enabled:
 *                 type: boolean
 *                 example: true
 *               priority:
 *                 type: integer
 *                 example: 0
 *               config:
 *                 type: object
 *                 description: "Provider-specific configuration (JSON object). Common fields: apiKey, baseUrl, rateLimitRps"
 *                 example:
 *                   apiKey: "your_api_key"
 *                   baseUrl: "https://api.themoviedb.org/3"
 *                   rateLimitRps: 4.0
 *     responses:
 *       '200':
 *         description: Provider created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MetadataProvider'
 */
router.get("/providers", providerControllers.getAll);

router.post("/providers", providerControllers.upsert);

/**
 * @swagger
 * /api/v1/settings/providers/{name}:
 *   get:
 *     summary: Get a specific provider
 *     description: Retrieves configuration for a specific metadata provider
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         example: "tmdb"
 *         description: "Provider name (e.g., 'tmdb', 'omdb', 'tvdb')"
 *     responses:
 *       '200':
 *         description: Provider configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MetadataProvider'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Update a provider
 *     description: Updates configuration for an existing metadata provider
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         example: "tmdb"
 *         description: "Provider name (e.g., 'tmdb', 'omdb', 'tvdb')"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProviderRequest'
 *     responses:
 *       '200':
 *         description: Provider updated successfully
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Delete a provider
 *     description: Removes a metadata provider configuration
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         example: "tmdb"
 *         description: "Provider name (e.g., 'tmdb', 'omdb', 'tvdb')"
 *     responses:
 *       '200':
 *         description: Provider deleted successfully
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/providers/:name", providerControllers.getByName);

router.put("/providers/:name", providerControllers.update);

router.delete("/providers/:name", providerControllers.delete);

/**
 * @swagger
 * /api/v1/settings/providers/reload:
 *   post:
 *     summary: Reload metadata providers
 *     description: Reloads metadata providers from the database in the metadata service and initializes the metadata service. If a provider is found and the queue consumer is not running, it will automatically start processing queued metadata jobs. This allows you to configure providers without restarting the metadata service.
 *     tags: [Settings]
 *     responses:
 *       '200':
 *         description: Providers reloaded successfully
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
 *                   example: "Providers reloaded successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     provider:
 *                       type: string
 *                       description: Name of the primary provider that was loaded
 *                       example: "tmdb"
 *       '503':
 *         description: Metadata service unavailable or no providers available
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
 *                   example: "Metadata service unavailable. Make sure the metadata service is running."
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/providers/reload", providerControllers.reload);

export default router;
