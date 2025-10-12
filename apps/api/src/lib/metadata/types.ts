import { ExternalIdSource, MediaType } from "../../generated/prisma/index.js";

/**
 * External ID in Plex format: {source-id}
 * Example: {tmdb-232252}, {imdb-tt1234567}
 */
export interface ParsedExternalId {
  source: ExternalIdSource;
  id: string;
  raw: string; // The original string like "{tmdb-232252}"
}

/**
 * Metadata fetched from external providers
 */
export interface MediaMetadata {
  title: string;
  originalTitle?: string;
  description?: string;
  releaseDate?: Date;
  rating?: number;
  posterUrl?: string;
  backdropUrl?: string;
  genres?: string[];

  // Media type specific fields
  movie?: {
    duration?: number;
    director?: string;
    trailerUrl?: string;
  };

  tvShow?: {
    creator?: string;
    network?: string;
    numberOfSeasons?: number;
    numberOfEpisodes?: number;
  };

  // People involved
  cast?: PersonMetadata[];
  crew?: PersonMetadata[];

  // External IDs from the provider
  externalIds?: {
    source: ExternalIdSource;
    id: string;
  }[];
}

export interface PersonMetadata {
  name: string;
  role: string; // "actor", "director", etc.
  character?: string;
  profileUrl?: string;
}

export interface SeasonMetadata {
  number: number;
  name?: string;
  overview?: string;
  airDate?: Date;
  episodeCount?: number;
  posterUrl?: string;
}

export interface EpisodeMetadata {
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  overview?: string;
  airDate?: Date;
  duration?: number;
  stillUrl?: string;
}

/**
 * Search result from external providers
 */
export interface MediaSearchResult {
  externalId: string;
  title: string;
  originalTitle?: string;
  releaseDate?: Date;
  overview?: string;
  posterUrl?: string;
  mediaType: MediaType;
  relevanceScore?: number;
}
