import express from "express";
import cors from "cors";
import { requestContextMiddleware } from "./lib/requestContext.js";
import { responseEnhancerMiddleware } from "./lib/response.js";
import { notFoundHandler, errorHandler } from "./lib/errorHandler.js";
import scanRouter from "./routes/scan/scan.module.js";

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// CORS configuration - allow requests from web app
app.use(
  cors({
    origin: process.env.WEB_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(requestContextMiddleware);
app.use(responseEnhancerMiddleware);

app.get("/health", (_req, res) => {
  res.jsonOk({ status: "ok" });
});

// API Routes
app.use("/api/scan", scanRouter);

app.use(notFoundHandler);

app.use(errorHandler);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
