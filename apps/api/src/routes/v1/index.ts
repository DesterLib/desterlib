import express, { Router } from "express";
import scanRoutes from "./scan/scan.routes";
import libraryRoutes from "./library/library.routes";
import moviesRoutes from "./movies/movies.routes";
import tvshowsRoutes from "./tvshows/tvshows.routes";
import streamRoutes from "./stream/stream.routes";

const router: Router = express.Router();

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

export default router;
