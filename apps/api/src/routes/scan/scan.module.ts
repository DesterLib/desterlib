import { Router, type Router as RouterType } from "express";
import { scanController } from "./scan.controller.js";

const router: RouterType = Router();

/**
 * @openapi
 * /api/scan:
 *   post:
 *     summary: Scan a directory for media files
 *     description: Recursively scans a directory and returns all media files matching the specified media type
 *     tags:
 *       - Scan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *               - mediaType
 *             properties:
 *               path:
 *                 type: string
 *                 description: Absolute path to the directory to scan
 *                 example: /Volumes/External/Library/Media/Shows/Anime
 *               mediaType:
 *                 $ref: '#/components/schemas/MediaType'
 *               collectionName:
 *                 type: string
 *                 description: Optional collection name (defaults to folder name)
 *                 example: My Anime Collection
 *     responses:
 *       200:
 *         description: Successfully scanned directory
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
 *                         message:
 *                           type: string
 *                           example: Successfully scanned 15 MOVIE files
 *                         scan:
 *                           $ref: '#/components/schemas/ScanResult'
 *       400:
 *         description: Bad request (invalid path or media type)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Path not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", (req, res, next) => {
  scanController.scanDirectory(req, res, next);
});

/**
 * @openapi
 * /api/scan/sync:
 *   post:
 *     summary: Sync a collection
 *     description: Checks for file modifications and removals in a collection
 *     tags:
 *       - Scan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - collectionName
 *               - mediaType
 *             properties:
 *               collectionName:
 *                 type: string
 *                 description: Name of the collection to sync
 *                 example: My Movie Collection
 *               mediaType:
 *                 $ref: '#/components/schemas/MediaType'
 *     responses:
 *       200:
 *         description: Successfully synced collection
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
 *                         message:
 *                           type: string
 *                           example: Sync complete - 10 files checked, 2 updated, 1 removed
 *                         sync:
 *                           $ref: '#/components/schemas/SyncResult'
 *       404:
 *         description: Collection not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/sync", (req, res, next) => {
  scanController.syncCollection(req, res, next);
});

/**
 * @openapi
 * /api/scan/sync-all:
 *   post:
 *     summary: Sync all collections
 *     description: Checks for file modifications and removals across all collections (for cron jobs)
 *     tags:
 *       - Scan
 *     responses:
 *       200:
 *         description: Successfully synced all collections
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
 *                         message:
 *                           type: string
 *                           example: Synced 3 collection(s) - 100 files checked, 5 updated, 2 removed
 *                         syncs:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/SyncResult'
 */
router.post("/sync-all", (req, res, next) => {
  scanController.syncAllCollections(req, res, next);
});

export default router;
