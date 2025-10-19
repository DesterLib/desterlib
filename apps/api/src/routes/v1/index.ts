import express, { Router } from "express";
import scanRoutes from "./scan/scan.routes";

const router: Router = express.Router();

// Scan routes
router.use("/scan", scanRoutes);

export default router;
