import { Router, type Router as RouterType } from "express";
import { collectionsController } from "./collections.controller.js";

const router: RouterType = Router();

/**
 * @openapi
 * /api/collections:
 *   get:
 *     summary: Get all collections
 *     description: Retrieve all collections with media count and recent media
 *     tags:
 *       - Collections
 *     responses:
 *       200:
 *         description: Successfully retrieved collections
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
 *                         collections:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Collection'
 */
router.get("/", (req, res, next) => {
  collectionsController.getCollections(req, res, next);
});

/**
 * @openapi
 * /api/collections/statistics:
 *   get:
 *     summary: Get collection statistics
 *     description: Retrieve statistics about collections
 *     tags:
 *       - Collections
 *     responses:
 *       200:
 *         description: Successfully retrieved statistics
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
 *                         statistics:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                             withMedia:
 *                               type: integer
 *                             empty:
 *                               type: integer
 */
router.get("/statistics", (req, res, next) => {
  collectionsController.getStatistics(req, res, next);
});

/**
 * @openapi
 * /api/collections/{slugOrId}:
 *   get:
 *     summary: Get a collection by slug or ID
 *     description: Retrieve a single collection with all its media
 *     tags:
 *       - Collections
 *     parameters:
 *       - in: path
 *         name: slugOrId
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection slug or ID
 *     responses:
 *       200:
 *         description: Successfully retrieved collection
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
 *                         collection:
 *                           $ref: '#/components/schemas/Collection'
 *       400:
 *         description: Bad request (missing or invalid slug/ID)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Collection not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:slugOrId", (req, res, next) => {
  collectionsController.getCollectionBySlugOrId(req, res, next);
});

export default router;
