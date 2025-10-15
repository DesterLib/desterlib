/**
 * Bulk Operations Routes
 *
 * Provides endpoints for bulk operations on media items
 */

import { Router } from "express";
import { bulkOperationsController } from "./bulk.controller.js";
import { asyncHandler } from "../asyncHandler.js";
import { validateRequest } from "../validation.js";
import {
  bulkDeleteSchema,
  bulkUpdateSchema,
  bulkCollectionSchema,
  bulkMetadataRefreshSchema,
} from "./bulk.schemas.js";

const router: Router = Router();

/**
 * @swagger
 * /api/v1/bulk/delete:
 *   post:
 *     summary: Bulk delete media items
 *     tags: [Bulk Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mediaIds
 *             properties:
 *               mediaIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 minItems: 1
 *                 maxItems: 1000
 *               deleteFiles:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Bulk delete completed
 */
router.post(
  "/delete",
  validateRequest({ body: bulkDeleteSchema }),
  asyncHandler(
    bulkOperationsController.deleteMedia.bind(bulkOperationsController)
  )
);

/**
 * @swagger
 * /api/v1/bulk/update:
 *   post:
 *     summary: Bulk update media metadata
 *     tags: [Bulk Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mediaIds
 *               - updates
 *             properties:
 *               mediaIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               updates:
 *                 type: object
 *                 properties:
 *                   genreIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: uuid
 *                   personIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                       format: uuid
 *                   rating:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 10
 *     responses:
 *       200:
 *         description: Bulk update completed
 */
router.post(
  "/update",
  validateRequest({ body: bulkUpdateSchema }),
  asyncHandler(
    bulkOperationsController.updateMedia.bind(bulkOperationsController)
  )
);

/**
 * @swagger
 * /api/v1/bulk/add-to-collection:
 *   post:
 *     summary: Bulk add media to collection
 *     tags: [Bulk Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mediaIds
 *               - collectionId
 *             properties:
 *               mediaIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               collectionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Bulk add to collection completed
 */
router.post(
  "/add-to-collection",
  validateRequest({ body: bulkCollectionSchema }),
  asyncHandler(
    bulkOperationsController.addToCollection.bind(bulkOperationsController)
  )
);

/**
 * @swagger
 * /api/v1/bulk/remove-from-collection:
 *   post:
 *     summary: Bulk remove media from collection
 *     tags: [Bulk Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mediaIds
 *               - collectionId
 *             properties:
 *               mediaIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               collectionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Bulk remove from collection completed
 */
router.post(
  "/remove-from-collection",
  validateRequest({ body: bulkCollectionSchema }),
  asyncHandler(
    bulkOperationsController.removeFromCollection.bind(bulkOperationsController)
  )
);

/**
 * @swagger
 * /api/v1/bulk/refresh-metadata:
 *   post:
 *     summary: Bulk refresh metadata
 *     tags: [Bulk Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mediaIds
 *             properties:
 *               mediaIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *                 maxItems: 500
 *               force:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Bulk metadata refresh queued
 */
router.post(
  "/refresh-metadata",
  validateRequest({ body: bulkMetadataRefreshSchema }),
  asyncHandler(
    bulkOperationsController.refreshMetadata.bind(bulkOperationsController)
  )
);

/**
 * @swagger
 * /api/v1/bulk/statistics:
 *   get:
 *     summary: Get bulk operation statistics
 *     tags: [Bulk Operations]
 *     responses:
 *       200:
 *         description: Bulk operation statistics retrieved
 */
router.get(
  "/statistics",
  asyncHandler(
    bulkOperationsController.getStatistics.bind(bulkOperationsController)
  )
);

export default router;
