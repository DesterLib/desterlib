import express from "express";
import path from "path";
import mainRoutes from "../../routes";
import v1Routes from "../../routes/v1";
import { swaggerUi, specs } from "./swagger";

export function setupRoutes(app: express.Application) {
  // Swagger documentation
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));

  // API v1 routes
  app.use("/api/v1", v1Routes);

  // Main routes (health, api info)
  app.use("/", mainRoutes);

  // Serve static files from the built web app (robust across dev/build)
  const webDistPath = path.resolve(__dirname, "../../../../web/dist");
  app.use(express.static(webDistPath, { index: false }));

  // SPA fallback to index.html (must be last)
  app.get("*", (req, res) => {
    // Skip API routes and health check for fallback
    if (req.path.startsWith("/api/") || req.path === "/health") {
      return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(webDistPath, "index.html"));
  });
}
