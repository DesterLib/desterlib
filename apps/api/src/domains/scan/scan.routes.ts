import express, { Router } from "express";
import { scanControllers } from "./scan.controller";
import { validateBody } from "../../lib/middleware";
import { scanPathSchema } from "./scan.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/scan/path:
 *   post:
 *     summary: Scan a local file path and fetch metadata
 *     description: |
 *       Scans a local directory path and returns discovered media files with metadata from configured providers (e.g., TMDB).
 *       - Automatically fetches metadata using the configured metadata provider
 *       - Extracts IDs from filenames and folder names (supports {tmdb-XXX}, {imdb-ttXXX}, {tvdb-XXX} formats)
 *       - Stores media information in the database with proper relationships
 *       - Supports both movies and TV shows
 *       - Uses database scan settings as defaults, which can be overridden by request parameters
 *       - Customizable with regex patterns for filenames and directories
 *     tags: [Scan]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - path
 *             properties:
 *               path:
 *                 type: string
 *                 description: Local file system path to scan
 *                 example: "/Volumes/External/Library/Media/Shows/Anime"
 *               options:
 *                 type: object
 *                 description: |
 *                   Scan configuration options. All options are optional and will default to values stored in database settings.
 *                   Any options provided here will override the corresponding database settings for this scan only.
 *                 properties:
 *                   mediaType:
 *                     type: string
 *                     enum: [movie, tv]
 *                     default: movie
 *                     description: |
 *                       Type of media to scan (movie or tv). Required for proper metadata fetching.
 *                       Defaults to database settings if not provided, or "movie" if no database setting exists.
 *                     example: "tv"
 *                   mediaTypeDepth:
 *                     type: object
 *                     description: |
 *                       Per-media-type depth configuration. Allows different depths for movies vs TV shows.
 *                       Defaults to database settings if not provided, or {movie: 2, tv: 4} if no database setting exists.
 *                       You can provide only movie or only tv to override just one type.
 *                     properties:
 *                       movie:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 10
 *                         description: Maximum directory depth for movie scans (0-10)
 *                         example: 2
 *                       tv:
 *                         type: number
 *                         minimum: 0
 *                         maximum: 10
 *                         description: Maximum directory depth for TV show scans (0-10)
 *                         example: 4
 *                   filenamePattern:
 *                     type: string
 *                     description: |
 *                       Regex pattern to match filenames. Only files matching this pattern will be scanned.
 *                       Example: '^.*S\\d{2}E\\d{2}.*$' for episode files (S01E01, S02E05, etc.)
 *                       Defaults to database settings if not provided. If not set in database, all files matching video extensions are scanned.
 *                     example: "^.*S\\d{2}E\\d{2}.*$"
 *                   directoryPattern:
 *                     type: string
 *                     description: |
 *                       Regex pattern to match directory names. Only directories matching this pattern will be scanned.
 *                       Useful for specific folder structures (e.g., "^Season \\d+$" to only scan Season folders).
 *                       Defaults to database settings if not provided. If not set in database, all directories are scanned.
 *                     example: "^Season \\d+$"
 *                   rescan:
 *                     type: boolean
 *                     description: |
 *                       If true, re-fetches metadata even if it already exists in the database.
 *                       If false, skips items that already have metadata.
 *                       Defaults to database settings if not provided, or false if no database setting exists.
 *                     example: false
 *                   batchScan:
 *                     type: boolean
 *                     description: |
 *                       Enable batch scanning mode for large libraries. Automatically enabled for TV shows.
 *                       Batches: 5 shows or 25 movies per batch. Useful for slow storage (FTP, SMB, etc.)
 *                       Defaults to database settings if not provided, or false if no database setting exists.
 *                     example: true
 *                   followSymlinks:
 *                     type: boolean
 *                     description: |
 *                       Whether to follow symbolic links during scanning.
 *                       Defaults to database settings if not provided, or true if no database setting exists.
 *                     example: true
 *     responses:
 *       202:
 *         description: Scan accepted and queued/started. Progress updates sent via WebSocket.
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
 *                     path:
 *                       type: string
 *                       example: "/Volumes/External/Library/Media/Shows/Anime"
 *                     mediaType:
 *                       type: string
 *                       example: "tv"
 *                     queued:
 *                       type: boolean
 *                       description: Whether the scan was queued (true) or started immediately (false)
 *                       example: false
 *                     queuePosition:
 *                       type: number
 *                       description: Position in queue (only present if queued is true)
 *                       example: 2
 *                 message:
 *                   type: string
 *                   example: "Scan started successfully. Progress will be sent via WebSocket."
 *       400:
 *         description: Bad request - Invalid path, validation error, or missing metadata provider configuration
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
 *                   example: "No metadata provider configured. Please configure a metadata provider (e.g., TMDB) in settings."
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
 *                   example: "Failed to scan path"
 */
router.post("/path", validateBody(scanPathSchema), scanControllers.post);

/**
 * @swagger
 * /api/v1/scan/resume/{scanJobId}:
 *   post:
 *     summary: Resume a failed or paused scan job
 *     description: |
 *       Resumes a scan job that was previously paused or failed.
 *       - Continues processing from where it left off
 *       - Only processes remaining unscanned folders
 *       - Sends progress updates via WebSocket
 *     tags: [Scan]
 *     parameters:
 *       - in: path
 *         name: scanJobId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the scan job to resume
 *         example: "clxxxx1234567890abcdefgh"
 *     responses:
 *       202:
 *         description: Scan resumed successfully
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
 *                   example: "Scan resumed successfully. Progress will be sent via WebSocket."
 *                 data:
 *                   type: object
 *                   properties:
 *                     scanJobId:
 *                       type: string
 *                       example: "clxxxx1234567890abcdefgh"
 *       400:
 *         description: Bad request - Invalid scan job ID or cannot resume
 *       404:
 *         description: Scan job not found
 *       500:
 *         description: Internal server error
 */
router.post("/resume/:scanJobId", scanControllers.resumeScan);

/**
 * @swagger
 * /api/v1/scan/job/{scanJobId}:
 *   get:
 *     summary: Get scan job status
 *     description: Get detailed status information about a scan job
 *     tags: [Scan]
 *     parameters:
 *       - in: path
 *         name: scanJobId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scan job status retrieved successfully
 *       404:
 *         description: Scan job not found
 */
router.get("/job/:scanJobId", scanControllers.getJobStatus);

/**
 * @swagger
 * /api/v1/scan/cleanup:
 *   post:
 *     summary: Cleanup stale scan jobs
 *     description: |
 *       Manually trigger cleanup of scan jobs that have been stuck in IN_PROGRESS state.
 *       Useful after API crashes or unexpected shutdowns.
 *     tags: [Scan]
 *     responses:
 *       200:
 *         description: Cleanup completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     cleanedCount:
 *                       type: number
 *                     message:
 *                       type: string
 */
router.post("/cleanup", scanControllers.cleanupStaleJobs);

export default router;
