import type { Request, Response } from "express";
import { streamService } from "../../../app/stream";
import { logger } from "@dester/logger";
import { NotFoundError } from "../../../infrastructure/utils/errors";
import {
  mapHostToContainerPath,
  checkMountPointAccessibility,
} from "../../../infrastructure/docker";
import { getMimeType } from "../../../infrastructure/utils/mime-types";
import { z } from "zod";
import { streamMediaSchema } from "../schemas/stream.schema";
import { promises as fs } from "fs";
import { createReadStream } from "fs";
import path from "path";
import { asyncHandler } from "../../../infrastructure/utils/async-handler";

type StreamMediaRequest = z.infer<typeof streamMediaSchema>;

export const streamControllers = {
  /**
   * Stream media file with range support
   */
  streamMedia: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData as StreamMediaRequest;

    // Get media file info
    const mediaFile = await streamService.getMediaFileById(id);
    const hostFilePath = mediaFile.filePath;

    // Map host path to container path for Docker file access
    const filePath = mapHostToContainerPath(hostFilePath);

    logger.info(`Streaming file: ${hostFilePath} -> ${filePath}`);

    // Security check: ensure file path is absolute and exists
    if (!path.isAbsolute(filePath)) {
      throw new NotFoundError("Media file", id);
    }

    // Check if file exists and get stats
    let fileStats;
    try {
      fileStats = await fs.stat(filePath);
      logger.info(`File found: ${filePath} (${fileStats.size} bytes)`);
    } catch (statError) {
      logger.error(`File not found: ${filePath}`);
      logger.error(`Original host path: ${hostFilePath}`);
      logger.error(`Mapped container path: ${filePath}`);
      logger.error(`Error details:`, statError);

      // Check Docker mount point accessibility for debugging
      await checkMountPointAccessibility();

      throw new NotFoundError(
        "Media file",
        `${id}. Host path: ${hostFilePath}, Container path: ${filePath}`
      );
    }

    const fileSize = fileStats.size;
    const range = req.headers.range;

    // Get content type from file extension
    const ext = path.extname(filePath);
    const contentType = getMimeType(ext);

    // Set basic headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Length", fileSize);
    res.setHeader("Cache-Control", "public, max-age=31536000");

    // Add filename for download if needed
    if (mediaFile.title) {
      const filename = `${mediaFile.title}${ext}`;
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    }

    if (!range) {
      // No range requested, send entire file
      res.status(200);
      const fileStream = createReadStream(filePath, {
        highWaterMark: 1024 * 1024, // 1MB chunks
      });

      fileStream.on("error", (error) => {
        logger.error(`Stream error for ${filePath}:`, error);
        if (!res.headersSent) {
          res.status(500).end();
        }
      });

      res.on("close", () => {
        fileStream.destroy();
      });

      return fileStream.pipe(res);
    }

    // Parse range header
    const ranges = (range || "").replace(/bytes=/, "").split("-");
    const start = parseInt(ranges[0] || "0", 10);
    const end = ranges[1] ? parseInt(ranges[1], 10) : fileSize - 1;

    // Validate range
    if (start >= fileSize || end >= fileSize || start > end) {
      res.status(416).setHeader("Content-Range", `bytes */${fileSize}`);
      return res.json({
        success: false,
        error: "Range Not Satisfiable",
        message: "Requested range not satisfiable",
      });
    }

    const chunkSize = end - start + 1;

    // Set range response headers
    res.status(206);
    res.setHeader("Content-Range", `bytes ${start}-${end}/${fileSize}`);
    res.setHeader("Content-Length", chunkSize);

    // Create stream for the requested range
    const fileStream = createReadStream(filePath, {
      start,
      end,
      highWaterMark: 1024 * 1024, // 1MB chunks
    });

    fileStream.on("error", (error) => {
      logger.error(`Stream error for ${filePath}:`, error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Internal server error",
          message: "Failed to stream file",
        });
      }
    });

    res.on("close", () => {
      logger.debug(`Client disconnected, destroying stream for ${filePath}`);
      fileStream.destroy();
    });

    return fileStream.pipe(res);
  }),
};
