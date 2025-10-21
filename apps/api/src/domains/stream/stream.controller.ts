import { Request, Response } from "express";
import { streamServices } from "./stream.services";
import { logger, mapHostToContainerPath } from "@/lib/utils";
import { z } from "zod";
import { streamMediaSchema } from "./stream.schema";
import { promises as fs } from "fs";
import { createReadStream } from "fs";
import path from "path";

type StreamMediaRequest = z.infer<typeof streamMediaSchema>;

export const streamControllers = {
  streamMedia: async (req: Request, res: Response) => {
    try {
      const validatedParams = req.validatedData as StreamMediaRequest;

      if (!validatedParams) {
        return res.status(400).json({
          error: "Validation failed",
          message: "Media ID is required",
        });
      }

      const { id } = validatedParams;

      // Get media file info - this will find the file across all media types
      const mediaFile = await streamServices.getMediaFileById(id);
      const hostFilePath = mediaFile.filePath;

      // Map host path to container path for Docker file access
      const filePath = mapHostToContainerPath(hostFilePath);

      logger.info(`Streaming file: ${hostFilePath} -> ${filePath}`);

      // Security check: ensure file path is absolute and exists
      if (!path.isAbsolute(filePath)) {
        return res.status(400).json({
          error: "Bad request",
          message: "Invalid file path",
        });
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

        // Try to check if the mount point exists
        try {
          await fs.access("/media");
          logger.info("✅ /media mount point exists");
        } catch (mountError) {
          logger.error("❌ /media mount point not accessible", mountError);
        }

        return res.status(404).json({
          error: "Not found",
          message: `Media file not found on disk. Host path: ${hostFilePath}, Container path: ${filePath}`,
        });
      }

      const fileSize = fileStats.size;
      const range = req.headers.range;

      // Set content type based on file extension
      const ext = path.extname(filePath).toLowerCase();
      let contentType = "application/octet-stream"; // default

      // Video types
      if (ext === ".mp4") contentType = "video/mp4";
      else if (ext === ".mkv") contentType = "video/x-matroska";
      else if (ext === ".avi") contentType = "video/x-msvideo";
      else if (ext === ".mov") contentType = "video/quicktime";
      else if (ext === ".wmv") contentType = "video/x-ms-wmv";
      else if (ext === ".m4v") contentType = "video/x-m4v";
      // Audio types
      else if (ext === ".mp3") contentType = "audio/mpeg";
      else if (ext === ".flac") contentType = "audio/flac";
      else if (ext === ".wav") contentType = "audio/wav";
      else if (ext === ".ogg") contentType = "audio/ogg";
      else if (ext === ".m4a") contentType = "audio/mp4";
      // Other types
      else if (ext === ".pdf") contentType = "application/pdf";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".png") contentType = "image/png";

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
        const fileStream = createReadStream(filePath);
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
      const fileStream = createReadStream(filePath, { start, end });

      fileStream.on("error", (error) => {
        logger.error(`Stream error for ${filePath}:`, error);
        if (!res.headersSent) {
          res.status(500).json({
            error: "Internal server error",
            message: "Failed to stream file",
          });
        }
      });

      return fileStream.pipe(res);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to stream media file";
      logger.error(`Stream media controller error: ${errorMessage}`);

      if (!res.headersSent) {
        return res.status(500).json({
          error: "Internal server error",
          message: errorMessage,
        });
      }
    }
  },
};
