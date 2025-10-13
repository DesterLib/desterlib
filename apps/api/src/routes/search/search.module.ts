import { Router, type Router as RouterType } from "express";
import { searchController } from "./search.controller.js";

const router: RouterType = Router();

/**
 * @openapi
 * /api/search:
 *   get:
 *     summary: Search across all content
 *     description: Search for media and collections by title/name
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: type
 *         required: false
 *         schema:
 *           type: string
 *           enum: [media, collections]
 *         description: Filter results by type (optional)
 *     responses:
 *       200:
 *         description: Successfully retrieved search results
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
 *                         query:
 *                           type: string
 *                         media:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Media'
 *                         collections:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Collection'
 *                         total:
 *                           type: integer
 *       400:
 *         description: Bad request (missing query parameter)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/", (req, res, next) => {
  searchController.search(req, res, next);
});

export default router;
