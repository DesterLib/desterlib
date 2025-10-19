import express, { Router } from "express";
import { scanPathController } from "./scan.controller";
import { validateBody } from "../../../lib/middleware";
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
 *                 path:
 *                   type: string
 *                   example: "/Volumes/External/Library/Media/Shows/Anime"
 *                 results:
 *                   type: object
 *                   properties:
 *                     totalFiles:
 *                       type: number
 *                       description: Total number of files and directories found
 *                       example: 15
 *                     entries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           path:
 *                             type: string
 *                             description: Full path to the file or directory
 *                             example: "/Volumes/External/Library/Media/Shows/Anime/Delico's Nursery {tmdb-232252}"
 *                           name:
 *                             type: string
 *                             description: File or directory name
 *                             example: "Delico's Nursery {tmdb-232252}"
 *                           isDirectory:
 *                             type: boolean
 *                             description: Whether the entry is a directory
 *                             example: true
 *                           size:
 *                             type: number
 *                             description: File size in bytes (or directory entry size)
 *                             example: 122964426
 *                           modified:
 *                             type: string
 *                             format: date-time
 *                             description: Last modified timestamp
 *                             example: "2025-09-15T20:14:12.076Z"
 *                           extractedIds:
 *                             type: object
 *                             description: IDs extracted from filename or directory name
 *                             properties:
 *                               tmdbId:
 *                                 type: string
 *                                 example: "232252"
 *                               imdbId:
 *                                 type: string
 *                               tvdbId:
 *                                 type: string
 *                               year:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                                 example: "Delico's Nursery"
 *                           metadata:
 *                             type: object
 *                             description: |
 *                               TMDB metadata (only present if a TMDB ID was found and metadata was successfully fetched).
 *                               Includes title, overview, poster_path, backdrop_path, vote_average, release_date, and credits.
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
router.post("/path", validateBody(scanPathSchema), scanPathController);

export default router;
