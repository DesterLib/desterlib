import express, { Router } from "express";
import { scanControllers } from "../../controllers/scan.controller";
import { validateBody, validateParams } from "../../middleware";
import { scanPathSchema } from "../../schemas/scan.schema";
import { z } from "zod";

const router: Router = express.Router();

// Scan job ID parameter schema
const scanJobIdSchema = z.object({
  scanJobId: z.string().min(1, "Scan job ID is required"),
});

/**
 * @swagger
 * /api/v1/scan/path:
 *   post:
 *     summary: Scan a directory path for media files
 *     description: Initiates a scan of a local file path to discover and process media files (movies, TV shows). The scan is processed asynchronously by the scanner service.
 *     tags: [Scan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *             additionalProperties: true
 *             properties:
 *               path:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 5000
 *                 description: Local file system path to scan
 *                 example: "/media/movies"
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Library name. If not provided, will be generated from the path. If a library with the same path exists, this will update its name.
 *                 example: "My Movie Library"
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Library description. Optional. If a library with the same path exists, this will update its description.
 *                 example: "Collection of movies and TV shows"
 *               options:
 *                 $ref: '#/components/schemas/ScanOptions'
 *           examples:
 *             minimal:
 *               summary: Minimal request
 *               value:
 *                 path: "/media/movies"
 *                 options:
 *                   mediaType: "movie"
 *             withNameAndDescription:
 *               summary: Request with library name and description
 *               value:
 *                 path: "/media/movies"
 *                 name: "My Movie Library"
 *                 description: "Collection of movies and TV shows"
 *                 options:
 *                   mediaType: "movie"
 *             withOptions:
 *               summary: Full request with all options
 *               value:
 *                 path: "/media/movies"
 *                 name: "My Movie Library"
 *                 description: "Collection of movies and TV shows"
 *                 options:
 *                   mediaType: "movie"
 *                   mediaTypeDepth:
 *                     movie: 2
 *                     tv: 4
 *                   rescan: false
 *                   followSymlinks: true
 *             incorrectMediaType:
 *               summary: ❌ Incorrect - mediaType must be lowercase
 *               value:
 *                 path: "/media/movies"
 *                 options:
 *                   mediaType: "Movies"
 *     responses:
 *       '202':
 *         description: Scan job accepted and queued. The library record is created or updated automatically.
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
 *                   example: "Scan offloaded to scanner service successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     libraryId:
 *                       type: string
 *                       description: Library record ID (created or updated)
 *                       example: "clx1234567890123456789012"
 *                     libraryName:
 *                       type: string
 *                       description: Library name
 *                       example: "My Movie Library"
 *                     path:
 *                       type: string
 *                       description: Scanned path
 *                       example: "/media/movies"
 *                     mediaType:
 *                       type: string
 *                       enum: [movie, tv]
 *                       example: "movie"
 *                       description: "Media type used for the scan (determines directory structure parsing)"
 *                     maxDepth:
 *                       type: integer
 *                       minimum: 0
 *                       maximum: 10
 *                       example: 2
 *                     jobId:
 *                       type: string
 *                       description: Unique identifier for the scan job
 *                       example: "clx1234567890123456789012"
 *                     message:
 *                       type: string
 *                       description: Confirmation message
 *                       example: "Scan job created and offloaded to scanner service"
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post("/path", validateBody(scanPathSchema), scanControllers.post);

/**
 * @swagger
 * /api/v1/scan/job/{scanJobId}:
 *   get:
 *     summary: Get scan job status
 *     description: Retrieves the current status and progress of a scan job
 *     tags: [Scan]
 *     parameters:
 *       - in: path
 *         name: scanJobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Scan job identifier
 *         example: "clx1234567890123456789012"
 *     responses:
 *       '200':
 *         description: Scan job status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobId:
 *                       type: string
 *                       description: Scan job identifier
 *                       example: "clx1234567890123456789012"
 *                     status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed]
 *                       description: Current status of the scan job (file scanning)
 *                       example: "processing"
 *                     metadataStatus:
 *                       type: string
 *                       enum: [not_started, pending, processing, completed, failed]
 *                       description: Current status of the metadata fetching process
 *                       example: "processing"
 *                     totalFiles:
 *                       type: integer
 *                       description: Number of files scanned so far
 *                       example: 1250
 *                     progress:
 *                       type: number
 *                       minimum: 0
 *                       maximum: 100
 *                       description: Progress percentage (0-100)
 *                       example: 50
 *                     message:
 *                       type: string
 *                       description: Status message
 *                       example: "Processing: 1250 files scanned"
 *                     metadataSuccessCount:
 *                       type: integer
 *                       description: Number of successful metadata fetches
 *                       example: 250
 *                     metadataFailedCount:
 *                       type: integer
 *                       description: Number of failed metadata fetches
 *                       example: 5
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  "/job/:scanJobId",
  validateParams(scanJobIdSchema),
  scanControllers.getJobStatus
);

/**
 * @swagger
 * /api/v1/scan/jobs:
 *   get:
 *     summary: Get all scan jobs
 *     description: Retrieves all scan jobs, optionally filtered by status or library ID. Supports pagination.
 *     tags: [Scan]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, IN_PROGRESS, COMPLETED, FAILED, PAUSED]
 *         description: Filter by scan job status
 *       - in: query
 *         name: libraryId
 *         schema:
 *           type: string
 *         description: Filter by library ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Maximum number of jobs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of jobs to skip
 *     responses:
 *       '200':
 *         description: List of scan jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     jobs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           libraryId:
 *                             type: string
 *                           scanPath:
 *                             type: string
 *                           mediaType:
 *                             type: string
 *                             enum: [MOVIE, TV_SHOW]
 *                           status:
 *                             type: string
 *                             enum: [PENDING, IN_PROGRESS, COMPLETED, FAILED, PAUSED]
 *                             description: Status of the file scanning process
 *                           metadataStatus:
 *                             type: string
 *                             enum: [NOT_STARTED, PENDING, IN_PROGRESS, COMPLETED, FAILED]
 *                             description: Status of the metadata fetching process
 *                           scannedCount:
 *                             type: integer
 *                             description: Number of files scanned
 *                           metadataSuccessCount:
 *                             type: integer
 *                             description: Number of successful metadata fetches
 *                           metadataFailedCount:
 *                             type: integer
 *                             description: Number of failed metadata fetches
 *                           startedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           completedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           metadataStartedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: When metadata processing started
 *                           metadataCompletedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: When metadata processing completed
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                           library:
 *                             type: object
 *                             nullable: true
 *                             properties:
 *                               id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               libraryPath:
 *                                 type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get("/jobs", scanControllers.getAllJobs);

/**
 * @swagger
 * /api/v1/scan/cleanup:
 *   post:
 *     summary: Cleanup stale scan jobs
 *     description: "Removes completed or failed scan jobs older than the specified days (default: 30)"
 *     tags: [Scan]
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 30
 *         description: Number of days to look back for stale jobs
 *     responses:
 *       '200':
 *         description: Cleanup completed
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
 *                   example: "Cleaned up 5 stale scan jobs"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cleanedCount:
 *                       type: integer
 *                       description: Number of stale jobs removed
 *                       example: 5
 *                     message:
 *                       type: string
 *                       example: "Successfully cleaned up 5 stale scan jobs"
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
/**
 * @swagger
 * /api/v1/scan/resume/{scanJobId}:
 *   post:
 *     summary: Resume a paused or failed scan job
 *     description: Resumes a scan job that was previously paused or failed. Continues processing from where it left off using pending folders.
 *     tags: [Scan]
 *     parameters:
 *       - in: path
 *         name: scanJobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Scan job identifier
 *         example: "clx1234567890123456789012"
 *     responses:
 *       '202':
 *         description: Scan job resumed successfully
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
 *                   example: "Scan job resumed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     scanJobId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [PENDING, IN_PROGRESS, COMPLETED, FAILED, PAUSED]
 *                     message:
 *                       type: string
 *       '400':
 *         $ref: '#/components/responses/BadRequest'
 *       '404':
 *         $ref: '#/components/responses/NotFound'
 *       '500':
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  "/resume/:scanJobId",
  validateParams(scanJobIdSchema),
  scanControllers.resume
);

router.post("/cleanup", scanControllers.cleanupStaleJobs);

export default router;
