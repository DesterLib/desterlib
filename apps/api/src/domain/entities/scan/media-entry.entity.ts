/**
 * Media Entry Domain Entity
 * Pure domain model - no infrastructure dependencies
 */

export interface MediaEntry {
  path: string;
  name: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
  extractedIds: {
    tmdbId?: string;
    imdbId?: string;
    tvdbId?: string;
    title?: string;
    year?: number;
    season?: number;
    episode?: number;
  };
  metadata?: MediaMetadata;
  plainPosterUrl?: string | null;
  logoUrl?: string | null;
}

export interface MediaMetadata {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  posterPath?: string;
  backdropPath?: string;
  releaseDate?: string;
  firstAirDate?: string;
  voteAverage?: number;
}
