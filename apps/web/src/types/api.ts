/**
 * API Types - matching the backend Prisma schema
 */

// Enums
export type MediaType = "MOVIE" | "TV_SHOW" | "MUSIC" | "COMIC";

export type RoleType =
  | "ACTOR"
  | "DIRECTOR"
  | "WRITER"
  | "PRODUCER"
  | "ARTIST"
  | "COMPOSER"
  | "AUTHOR";

export type ExternalIdSource =
  | "TMDB"
  | "IMDB"
  | "TVDB"
  | "ANIDB"
  | "MYANIMELIST"
  | "MUSICBRAINZ"
  | "SPOTIFY"
  | "COMICVINE"
  | "OTHER";

// Core Models
export interface Media {
  id: string;
  title: string;
  type: MediaType;
  description: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: string | null; // ISO date string from backend
  rating: number | null;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Movie {
  id: string;
  duration: number | null; // in minutes
  trailerUrl: string | null;
  filePath: string | null;
  fileSize: string | null; // BigInt comes as string from JSON
  fileModifiedAt: string | null; // ISO date string
  mediaId: string;
}

export interface TVShow {
  id: string;
  creator: string | null;
  network: string | null;
  mediaId: string;
}

export interface Season {
  id: string;
  number: number;
  posterUrl: string | null;
  tvShowId: string;
}

export interface Episode {
  id: string;
  title: string;
  fileTitle: string | null;
  number: number;
  duration: number | null;
  airDate: string | null; // ISO date string
  stillPath: string | null; // Episode still/screenshot image URL
  filePath: string | null;
  fileSize: string | null; // BigInt comes as string from JSON
  fileModifiedAt: string | null; // ISO date string
  seasonId: string;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  bio: string | null;
  birthDate: string | null; // ISO date string
  profileUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExternalId {
  id: string;
  source: ExternalIdSource;
  externalId: string;
  mediaId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Library {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  isLibrary: boolean;
  libraryPath: string | null;
  libraryType: MediaType | null;
  createdAt: string;
  updatedAt: string;
  parentId: string | null;
  mediaCount: number;
}

// Response Types with Relations
export interface MovieWithMedia extends Movie {
  media: Media;
}

export interface TVShowWithMedia extends TVShow {
  media: Media;
}

export interface SeasonWithEpisodes extends Season {
  episodes: Episode[];
}

export interface TVShowWithSeasonsAndMedia extends TVShow {
  media: Media;
  seasons: SeasonWithEpisodes[];
}

// API Response Types
export type MovieResponse = MovieWithMedia;
export type MoviesListResponse = MovieWithMedia[];

export type TVShowResponse = TVShowWithSeasonsAndMedia;
export type TVShowsListResponse = TVShowWithMedia[];

export type LibraryListResponse = Library[];

export interface LibraryUpdateRequest {
  id: string;
  name?: string;
  description?: string;
  posterUrl?: string;
  backdropUrl?: string;
  libraryPath?: string;
  libraryType?: MediaType;
}

export interface LibraryUpdateResponse {
  success: boolean;
  library: Library;
  message: string;
}

export interface LibraryDeleteResponse {
  success: boolean;
  libraryId: string;
  libraryName: string;
  mediaDeleted: number;
  message: string;
}
