import { Router, type Router as RouterType } from "express";
import { asyncHandler } from "../../lib/asyncHandler.js";
import { validateRequest } from "../../lib/validation.js";
import { collectionsController } from "./collections.controller.js";
import { slugOrIdParamSchema, idParamSchema } from "./collections.schemas.js";

const router: RouterType = Router();

/**
 * @openapi
 * /api/v1/collections:
 *   get:
 *     summary: Get all collections
 *     description: Retrieve all collections with media count and recent media
 *     tags:
 *       - Collections
 *     responses:
 *       200:
 *         description: Successfully retrieved collections
 */
router.get(
  "/",
  asyncHandler(collectionsController.getCollections.bind(collectionsController))
);

/**
 * @openapi
 * /api/v1/collections/statistics:
 *   get:
 *     summary: Get collection statistics
 *     description: Retrieve statistics about collections
 *     tags:
 *       - Collections
 *     responses:
 *       200:
 *         description: Successfully retrieved statistics
 */
router.get(
  "/statistics",
  asyncHandler(collectionsController.getStatistics.bind(collectionsController))
);

/**
 * @openapi
 * /api/v1/collections/libraries:
 *   get:
 *     summary: Get all libraries
 *     description: Retrieve all collections that are libraries
 *     tags:
 *       - Collections
 *     responses:
 *       200:
 *         description: Successfully retrieved libraries
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
router.get(
  "/libraries",
  asyncHandler(collectionsController.getLibraries.bind(collectionsController))
);

/**
 * @openapi
 * /api/v1/collections/{slugOrId}:
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
 *     responses:
 *       200:
 *         description: Successfully retrieved collection
 *       404:
 *         description: Collection not found
 */
router.get(
  "/:slugOrId",
  validateRequest({ params: slugOrIdParamSchema }),
  asyncHandler(
    collectionsController.getCollectionBySlugOrId.bind(collectionsController)
  )
);

/**
 * @openapi
 * /api/v1/collections/{id}:
 *   delete:
 *     summary: Delete a collection
 *     description: Delete a collection and all its media relationships
 *     tags:
 *       - Collections
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection deleted successfully
 *       404:
 *         description: Collection not found
 */
router.delete(
  "/:id",
  validateRequest({ params: idParamSchema }),
  asyncHandler(
    collectionsController.deleteCollection.bind(collectionsController)
  )
);

export default router;
