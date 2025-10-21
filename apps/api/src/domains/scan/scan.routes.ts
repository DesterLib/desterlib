import express, { Router } from "express";
import { scanControllers } from "./scan.controller";
import { validateBody } from "../../lib/middleware";
import { scanPathSchema } from "./scan.schema";

const router: Router = express.Router();

/**
 * @swagger
 * /api/v1/scan/path:
 *   post:
 *     summary: Scan a local file path and fetch TMDB metadata
 *     description: |
 *       Scans a local directory path and returns discovered media files with TMDB metadata.
 *       - Automatically fetches metadata from TMDB using the API key from environment variables
 *       - Extracts IDs from filenames and folder names (supports {tmdb-XXX}, {imdb-ttXXX}, {tvdb-XXX} formats)
 *       - Stores media information in the database with proper relationships
 *       - Supports both movies and TV shows
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
 *                 example: /Volumes/External/Library/Media/Shows/Anime
 *                 default: /Volumes/External/Library/Media/Shows/Anime
 *               options:
 *                 type: object
 *                 properties:
 *                   maxDepth:
 *                     type: number
 *                     description: Maximum directory depth to scan (0-10)
 *                     minimum: 0
 *                     maximum: 10
 *                     default: Infinity
 *                     example: 3
 *                   mediaType:
 *                     type: string
 *                     enum: [movie, tv]
 *                     description: Media type for TMDB API calls (movie or tv). Required for proper metadata fetching.
 *                     default: movie
 *                     example: tv
 *                   fileExtensions:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: File extensions to include in the scan
 *                     default: [".mkv", ".mp4", ".avi", ".mov", ".wmv", ".m4v"]
 *                     example: [".mkv", ".mp4", ".avi"]
 *                   libraryName:
 *                     type: string
 *                     description: Name for the library. If not provided, uses "Library - {path}"
 *                     minLength: 1
 *                     maxLength: 100
 *                     example: "My Anime Library"
 *                   rescan:
 *                     type: boolean
 *                     description: If true, re-fetches metadata from TMDB even if it already exists in the database. If false or omitted, skips items that already have metadata.
 *                     default: false
 *                     example: false
 *     responses:
 *       200:
 *         description: Successful scan
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
 *                   example: "Scan completed successfully"
 *                 libraryId:
 *                   type: string
 *                   description: The ID of the library that was scanned
 *                   example: "clxxxx1234567890abcdefgh"
 *                 libraryName:
 *                   type: string
 *                   description: The name of the library
 *                   example: "My Anime Library"
 *                 totalFiles:
 *                   type: number
 *                   description: Total number of media files discovered during scan
 *                   example: 15
 *                 totalSaved:
 *                   type: number
 *                   description: Total number of media files successfully saved to the database
 *                   example: 14
 *                 cacheStats:
 *                   type: object
 *                   description: Cache statistics showing metadata reuse
 *                   properties:
 *                     metadataFromCache:
 *                       type: number
 *                       description: Number of items that reused existing metadata from database
 *                       example: 10
 *                     metadataFromTMDB:
 *                       type: number
 *                       description: Number of items that fetched fresh metadata from TMDB
 *                       example: 5
 *                     totalMetadataFetched:
 *                       type: number
 *                       description: Total number of items with metadata
 *                       example: 15
 *       400:
 *         description: Bad request - Invalid path, validation error, or missing TMDB API key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Validation failed"
 *                 message:
 *                   type: string
 *                   example: "Invalid or unsafe file path"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *                 message:
 *                   type: string
 *                   example: "Failed to scan path"
 */
router.post("/path", validateBody(scanPathSchema), scanControllers.post);

export default router;
