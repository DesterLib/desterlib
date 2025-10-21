import express from "express";
import mainRoutes from "../../routes";
import v1Routes from "../../routes/v1";
import { swaggerUi, specs } from "../../lib/config/swagger";

export function setupRoutes(app: express.Application) {
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(specs));
  app.use("/api/v1", v1Routes);
  app.use("/", mainRoutes);
}
