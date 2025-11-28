import express from "express";
import mainRoutes from "../../routes";
import v1Routes from "../../routes/v1";
import { swaggerUi, specs } from "../../lib/config/swagger";

export function setupRoutes(app: express.Application) {
  app.get("/api/docs/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    // Explicitly stringify to ensure proper escaping of newlines and special characters
    res.send(JSON.stringify(specs, null, 2));
  });

  // Use URL-based spec loading to avoid issues with unescaped characters in object passing
  // This ensures the JSON is properly parsed by the browser
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerOptions: {
        url: "/api/docs/swagger.json",
        persistAuthorization: true,
      },
    })
  );
  app.use("/api/v1", v1Routes);
  app.use("/", mainRoutes);
}
