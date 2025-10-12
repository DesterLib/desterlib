import { Router, type Router as RouterType } from "express";
import { scanController } from "./scan.controller.js";

const router: RouterType = Router();

// POST /api/scan - Scan a directory for media files
router.post("/", (req, res, next) => {
  scanController.scanDirectory(req, res, next);
});

// GET /api/scan/supported-extensions - Get supported file extensions
router.get("/supported-extensions", (req, res, next) => {
  scanController.getSupportedExtensions(req, res, next);
});

// GET /api/scan/media-types - Get all supported media types
router.get("/media-types", (req, res, next) => {
  scanController.getMediaTypes(req, res, next);
});

export default router;

