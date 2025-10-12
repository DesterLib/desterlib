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
 *                 example: /media/movies
 *               mediaType:
 *                 $ref: '#/components/schemas/MediaType'
 *               collectionName:
 *                 type: string
 *                 description: Optional collection name (defaults to folder name)
 *                 example: My Movie Collection
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

export default router;
