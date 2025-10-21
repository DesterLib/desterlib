import express from "express";
import path from "path";
import { existsSync } from "fs";
import mainRoutes from "../../routes";
import v1Routes from "../../routes/v1";
import { swaggerUi, specs } from "../../lib/config/swagger";
import { logger } from "../../lib/utils";

export function setupRoutes(app: express.Application) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));
  app.use("/api/v1", v1Routes);
  app.use("/", mainRoutes);

  // Serve static web assets with proper MIME type handling
  // Try multiple possible paths for web dist directory
  const possiblePaths = [
    path.join(process.cwd(), "web", "dist"), // Local development
    path.join(process.cwd(), "..", "web", "dist"), // Alternative local path
    path.join(__dirname, "..", "..", "..", "web", "dist"), // Docker container path
  ];

  const foundPath = possiblePaths.find((p) => existsSync(p));
  const webDistPath = foundPath || possiblePaths[0]!; // Non-null assertion since array has elements

  if (!foundPath) {
    logger.warn(
      `Web dist directory not found, using fallback path: ${webDistPath}`
    );
  } else {
    logger.info(`Using web dist path: ${webDistPath}`);
  }

  // Configure static middleware with proper MIME types
  app.use(
    express.static(webDistPath, {
      setHeaders: (res, filePath) => {
        // Get file extension
        const ext = path.extname(filePath).toLowerCase();

        // Explicitly set MIME types based on file extension
        switch (ext) {
          case ".css":
            res.setHeader("Content-Type", "text/css; charset=UTF-8");
            break;
          case ".js":
            res.setHeader(
              "Content-Type",
              "application/javascript; charset=UTF-8"
            );
            break;
          case ".html":
            res.setHeader("Content-Type", "text/html; charset=UTF-8");
            break;
          case ".json":
            res.setHeader("Content-Type", "application/json; charset=UTF-8");
            break;
          case ".png":
            res.setHeader("Content-Type", "image/png");
            break;
          case ".jpg":
          case ".jpeg":
            res.setHeader("Content-Type", "image/jpeg");
            break;
          case ".svg":
            res.setHeader("Content-Type", "image/svg+xml; charset=UTF-8");
            break;
          case ".woff":
            res.setHeader("Content-Type", "font/woff");
            break;
          case ".woff2":
            res.setHeader("Content-Type", "font/woff2");
            break;
          case ".ttf":
            res.setHeader("Content-Type", "font/ttf");
            break;
          case ".eot":
            res.setHeader("Content-Type", "application/vnd.ms-fontobject");
            break;
          default:
            // Let express handle other types
            break;
        }

        // Add cache headers for better performance (except for HTML files)
        if (ext !== ".html") {
          res.setHeader("Cache-Control", "public, max-age=31536000");
        }
      },
    })
  );

  // Fallback to index.html for client-side routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(webDistPath, "index.html"));
  });
}
