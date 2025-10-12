import type { Request, Response, NextFunction } from "express";
import { mediaService, type MediaFilters } from "./media.service.js";
import { BadRequestError, AppError, NotFoundError } from "../../lib/errors.js";
import type { MediaType } from "../../generated/prisma/index.js";
import fs from "fs";
import path from "path";

export class MediaController {
  /**
   * GET /api/media
   * Get all media with optional filters
   */
  async getMedia(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters: MediaFilters = {
        type: req.query.type as MediaType | undefined,
        search: req.query.search as string | undefined,
        genreId: req.query.genreId as string | undefined,
        personId: req.query.personId as string | undefined,
        collectionId: req.query.collectionId as string | undefined,
        minRating: req.query.minRating
          ? Number(req.query.minRating)
          : undefined,
        maxRating: req.query.maxRating
          ? Number(req.query.maxRating)
          : undefined,
        releasedAfter: req.query.releasedAfter
          ? new Date(req.query.releasedAfter as string)
          : undefined,
        releasedBefore: req.query.releasedBefore
          ? new Date(req.query.releasedBefore as string)
          : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
      };

      const result = await mediaService.getMedia(filters);

      res.jsonOk({
        message: `Found ${result.media.length} media items`,
        ...result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch media", { cause: error }));
      }
    }
  }

  /**
   * GET /api/media/:id
   * Get a single media by ID
   */
  async getMediaById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError("Media ID is required");
      }

      const media = await mediaService.getMediaById(id);

      res.jsonOk({
        message: `Retrieved ${media.type.toLowerCase()}`,
        media,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch media", { cause: error }));
      }
    }
  }

  /**
   * GET /api/media/statistics
   * Get media statistics
   */
  async getStatistics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const stats = await mediaService.getStatistics();

      res.jsonOk({
        message: "Retrieved media statistics",
        statistics: stats,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch statistics", { cause: error }));
      }
    }
  }

  /**
   * GET /api/movies
   * Get all movies
   */
  async getMovies(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters: Omit<MediaFilters, "type"> = {
        search: req.query.search as string | undefined,
        genreId: req.query.genreId as string | undefined,
        personId: req.query.personId as string | undefined,
        collectionId: req.query.collectionId as string | undefined,
        minRating: req.query.minRating
          ? Number(req.query.minRating)
          : undefined,
        maxRating: req.query.maxRating
          ? Number(req.query.maxRating)
          : undefined,
        releasedAfter: req.query.releasedAfter
          ? new Date(req.query.releasedAfter as string)
          : undefined,
        releasedBefore: req.query.releasedBefore
          ? new Date(req.query.releasedBefore as string)
          : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
      };

      const result = await mediaService.getMovies(filters);

      res.jsonOk({
        message: `Found ${result.media.length} movies`,
        ...result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch movies", { cause: error }));
      }
    }
  }

  /**
   * GET /api/movies/:id
   * Get a single movie by ID
   */
  async getMovieById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError("Movie ID is required");
      }

      const movie = await mediaService.getMovieById(id);

      res.jsonOk({
        message: "Retrieved movie",
        media: movie,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch movie", { cause: error }));
      }
    }
  }

  /**
   * GET /api/tv-shows
   * Get all TV shows
   */
  async getTVShows(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters: Omit<MediaFilters, "type"> = {
        search: req.query.search as string | undefined,
        genreId: req.query.genreId as string | undefined,
        personId: req.query.personId as string | undefined,
        collectionId: req.query.collectionId as string | undefined,
        minRating: req.query.minRating
          ? Number(req.query.minRating)
          : undefined,
        maxRating: req.query.maxRating
          ? Number(req.query.maxRating)
          : undefined,
        releasedAfter: req.query.releasedAfter
          ? new Date(req.query.releasedAfter as string)
          : undefined,
        releasedBefore: req.query.releasedBefore
          ? new Date(req.query.releasedBefore as string)
          : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
      };

      const result = await mediaService.getTVShows(filters);

      res.jsonOk({
        message: `Found ${result.media.length} TV shows`,
        ...result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch TV shows", { cause: error }));
      }
    }
  }

  /**
   * GET /api/tv-shows/:id
   * Get a single TV show by ID
   */
  async getTVShowById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError("TV show ID is required");
      }

      const tvShow = await mediaService.getTVShowById(id);

      res.jsonOk({
        message: "Retrieved TV show",
        media: tvShow,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch TV show", { cause: error }));
      }
    }
  }

  /**
   * GET /api/tv-shows/:id/seasons/:seasonNumber
   * Get a specific season of a TV show
   */
  async getSeasonById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id, seasonNumber } = req.params;

      if (!id || !seasonNumber) {
        throw new BadRequestError("TV show ID and season number are required");
      }

      const season = await mediaService.getSeasonById(id, Number(seasonNumber));

      res.jsonOk({
        message: `Retrieved season ${seasonNumber}`,
        season,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch season", { cause: error }));
      }
    }
  }

  /**
   * GET /api/tv-shows/:id/seasons/:seasonNumber/episodes/:episodeNumber
   * Get a specific episode of a TV show
   */
  async getEpisodeById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id, seasonNumber, episodeNumber } = req.params;

      if (!id || !seasonNumber || !episodeNumber) {
        throw new BadRequestError(
          "TV show ID, season number, and episode number are required"
        );
      }

      const episode = await mediaService.getEpisodeById(
        id,
        Number(seasonNumber),
        Number(episodeNumber)
      );

      res.jsonOk({
        message: `Retrieved episode ${episodeNumber}`,
        episode,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch episode", { cause: error }));
      }
    }
  }

  /**
   * GET /api/music
   * Get all music
   */
  async getMusic(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters: Omit<MediaFilters, "type"> = {
        search: req.query.search as string | undefined,
        genreId: req.query.genreId as string | undefined,
        personId: req.query.personId as string | undefined,
        collectionId: req.query.collectionId as string | undefined,
        minRating: req.query.minRating
          ? Number(req.query.minRating)
          : undefined,
        maxRating: req.query.maxRating
          ? Number(req.query.maxRating)
          : undefined,
        releasedAfter: req.query.releasedAfter
          ? new Date(req.query.releasedAfter as string)
          : undefined,
        releasedBefore: req.query.releasedBefore
          ? new Date(req.query.releasedBefore as string)
          : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
      };

      const result = await mediaService.getMusic(filters);

      res.jsonOk({
        message: `Found ${result.media.length} music items`,
        ...result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch music", { cause: error }));
      }
    }
  }

  /**
   * GET /api/music/:id
   * Get a single music by ID
   */
  async getMusicById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError("Music ID is required");
      }

      const music = await mediaService.getMusicById(id);

      res.jsonOk({
        message: "Retrieved music",
        media: music,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch music", { cause: error }));
      }
    }
  }

  /**
   * GET /api/comics
   * Get all comics
   */
  async getComics(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const filters: Omit<MediaFilters, "type"> = {
        search: req.query.search as string | undefined,
        genreId: req.query.genreId as string | undefined,
        personId: req.query.personId as string | undefined,
        collectionId: req.query.collectionId as string | undefined,
        minRating: req.query.minRating
          ? Number(req.query.minRating)
          : undefined,
        maxRating: req.query.maxRating
          ? Number(req.query.maxRating)
          : undefined,
        releasedAfter: req.query.releasedAfter
          ? new Date(req.query.releasedAfter as string)
          : undefined,
        releasedBefore: req.query.releasedBefore
          ? new Date(req.query.releasedBefore as string)
          : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : undefined,
        sortBy: req.query.sortBy as any,
        sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
      };

      const result = await mediaService.getComics(filters);

      res.jsonOk({
        message: `Found ${result.media.length} comics`,
        ...result,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch comics", { cause: error }));
      }
    }
  }

  /**
   * GET /api/comics/:id
   * Get a single comic by ID
   */
  async getComicById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError("Comic ID is required");
      }

      const comic = await mediaService.getComicById(id);

      res.jsonOk({
        message: "Retrieved comic",
        media: comic,
      });
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to fetch comic", { cause: error }));
      }
    }
  }

  /**
   * GET /api/stream/movie/:id
   * Stream a movie file
   */
  async streamMovie(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        throw new BadRequestError("Movie ID is required");
      }

      const movie = await mediaService.getMovieById(id);

      if (!movie.movie?.filePath) {
        throw new NotFoundError("Movie file not found");
      }

      this.streamFile(movie.movie.filePath, req, res);
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to stream movie", { cause: error }));
      }
    }
  }

  /**
   * GET /api/stream/episode/:id
   * Stream a TV episode file
   */
  async streamEpisode(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id, seasonNumber, episodeNumber } = req.params;

      if (!id || !seasonNumber || !episodeNumber) {
        throw new BadRequestError(
          "TV show ID, season number, and episode number are required"
        );
      }

      const episode = await mediaService.getEpisodeById(
        id,
        Number(seasonNumber),
        Number(episodeNumber)
      );

      if (!episode.filePath) {
        throw new NotFoundError("Episode file not found");
      }

      this.streamFile(episode.filePath, req, res);
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
      } else {
        next(new AppError("Failed to stream episode", { cause: error }));
      }
    }
  }

  /**
   * Helper method to stream a file with range support
   */
  private streamFile(filePath: string, req: Request, res: Response): void {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse range header
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0] || "0", 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize,
        "Content-Type": this.getMimeType(filePath),
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      // No range header, stream entire file
      const head = {
        "Content-Length": fileSize,
        "Content-Type": this.getMimeType(filePath),
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  }

  /**
   * Helper method to get MIME type based on file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".mp4": "video/mp4",
      ".mkv": "video/x-matroska",
      ".avi": "video/x-msvideo",
      ".mov": "video/quicktime",
      ".wmv": "video/x-ms-wmv",
      ".flv": "video/x-flv",
      ".webm": "video/webm",
      ".m4v": "video/x-m4v",
      ".mpg": "video/mpeg",
      ".mpeg": "video/mpeg",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }
}

// Export singleton instance
export const mediaController = new MediaController();
