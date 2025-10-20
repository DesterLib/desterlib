import express from "express";
import path from "path";
import fs from "fs";
import mainRoutes from "../../routes";
import v1Routes from "../../routes/v1";
import { swaggerUi, specs } from "./swagger";

function findWebDistPath(): string {
  const possiblePaths = [
    path.resolve(process.cwd(), "apps/web/dist"),
    path.resolve(process.cwd(), "../web/dist"),
    path.resolve("/app/apps/web/dist"), // Docker path
  ];

  const webDistPath = possiblePaths.find((dirPath) => {
    try {
      return fs.existsSync(dirPath);
    } catch {
      return false;
    }
  });

  if (!webDistPath) {
    throw new Error(
      `Web dist directory not found. Tried paths: ${possiblePaths.join(", ")}`
    );
  }

  return webDistPath;
}

export function setupRoutes(app: express.Application) {
  // Swagger documentation
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));

  // API v1 routes
  app.use("/api/v1", v1Routes);

  // Main routes (health, api info)
  app.use("/", mainRoutes);

  // Serve static files from the built web app
  const webDistPath = findWebDistPath();

  // Serve static files with proper caching
  app.use(
    express.static(webDistPath, {
      index: false,
      maxAge: "1y",
      etag: true,
      lastModified: true,
      setHeaders: (res, filePath) => {
        // Set proper content types
        const ext = path.extname(filePath);
        if (ext === ".js") {
          res.setHeader("Content-Type", "application/javascript");
        } else if (ext === ".css") {
          res.setHeader("Content-Type", "text/css");
        }
        // CORS headers for development
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader(
          "Access-Control-Allow-Methods",
          "GET, POST, PUT, DELETE, OPTIONS"
        );
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization"
        );
      },
    })
  );

  // SPA fallback - serve index.html for non-API routes
  app.get("*", (req, res) => {
    if (req.path.startsWith("/api/") || req.path === "/health") {
      return res.status(404).json({ error: "API endpoint not found" });
    }

    res.setHeader("Content-Type", "text/html");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.sendFile(path.join(webDistPath, "index.html"));
  });
}
