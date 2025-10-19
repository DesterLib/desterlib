import express from "express";
import mainRoutes from "../../routes";
import v1Routes from "../../routes/v1";
import { swaggerUi, specs } from "./swagger";

export function setupRoutes(app: express.Application) {
  // Swagger documentation
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));

  // Main routes (health, api info)
  app.use("/", mainRoutes);

  // API v1 routes
  app.use("/api/v1", v1Routes);
}
