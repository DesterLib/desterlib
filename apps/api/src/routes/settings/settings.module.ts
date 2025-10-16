import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import { settingsController } from "./settings.controller.js";
import {
  requireAuth,
  requireUserOrAdmin,
} from "../../lib/auth/auth.middleware.js";

const router: ExpressRouter = Router();

/**
 * @swagger
 * /api/v1/settings:
 *   get:
 *     summary: Get current settings
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         settings:
 *                           $ref: '#/components/schemas/Settings'
 */
router.get("/", (req, res, next) =>
  settingsController.getSettings(req, res, next)
);

/**
 * @swagger
 * /api/v1/settings/setup-status:
 *   get:
 *     summary: Check if initial setup is complete
 *     tags: [Settings]
 *     responses:
 *       200:
 *         description: Setup status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         isSetupComplete:
 *                           type: boolean
 */
router.get("/setup-status", (req, res, next) =>
  settingsController.getSetupStatus(req, res, next)
);

/**
 * @swagger
 * /api/v1/settings/complete-setup:
 *   post:
 *     summary: Complete initial setup
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - libraries
 *               - tmdbApiKey
 *             properties:
 *               libraries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - type
 *                     - path
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "My Movies"
 *                     type:
 *                       $ref: '#/components/schemas/MediaType'
 *                       example: "MOVIE"
 *                     path:
 *                       type: string
 *                       example: "/path/to/movies"
 *               tmdbApiKey:
 *                 type: string
 *                 example: "your_tmdb_api_key_here"
 *                 description: "Required TMDB API key for metadata"
 *     responses:
 *       200:
 *         description: Setup completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         settings:
 *                           $ref: '#/components/schemas/Settings'
 */
router.post("/complete-setup", requireAuth, (req, res, next) =>
  settingsController.completeSetup(req, res, next)
);

/**
 * @swagger
 * /api/v1/settings:
 *   patch:
 *     summary: Update settings
 *     tags: [Settings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               libraries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     type:
 *                       $ref: '#/components/schemas/MediaType'
 *                     path:
 *                       type: string
 *               tmdbApiKey:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         settings:
 *                           $ref: '#/components/schemas/Settings'
 */
router.patch("/", requireAuth, requireUserOrAdmin, (req, res, next) =>
  settingsController.updateSettings(req, res, next)
);

export default router;
