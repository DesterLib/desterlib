import express, { Router } from "express";
import scanRoutes from "./scan.routes";
import libraryRoutes from "./library.routes";
import moviesRoutes from "./movies.routes";
import tvshowsRoutes from "./tvshows.routes";
import settingsRoutes from "./settings.routes";
import streamRoutes from "./stream.routes";
import searchRoutes from "./search.routes";
import logsRoutes from "./logs.routes";

const router: Router = express.Router();

// Register domain routes
router.use("/scan", scanRoutes);
router.use("/library", libraryRoutes);
router.use("/movies", moviesRoutes);
router.use("/tvshows", tvshowsRoutes);
router.use("/settings", settingsRoutes);
router.use("/stream", streamRoutes);
router.use("/search", searchRoutes);
router.use("/logs", logsRoutes);

export default router;
