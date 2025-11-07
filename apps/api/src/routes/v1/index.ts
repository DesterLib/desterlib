import express, { Router } from "express";
import scanRoutes from "../../domains/scan/scan.routes";
import libraryRoutes from "../../domains/library/library.routes";
import moviesRoutes from "../../domains/movies/movies.routes";
import tvshowsRoutes from "../../domains/tvshows/tvshows.routes";
import streamRoutes from "../../domains/stream/stream.routes";
import settingsRoutes from "../../domains/settings/settings.routes";
import searchRoutes from "../../domains/search/search.routes";

const router: Router = express.Router();

// Search routes
router.use("/search", searchRoutes);

// Scan routes
router.use("/scan", scanRoutes);

// Library routes
router.use("/library", libraryRoutes);

// Movies routes
router.use("/movies", moviesRoutes);

// TV Shows routes
router.use("/tvshows", tvshowsRoutes);

// Stream routes - centralized media streaming
router.use("/stream", streamRoutes);

// Settings routes
router.use("/settings", settingsRoutes);

export default router;
