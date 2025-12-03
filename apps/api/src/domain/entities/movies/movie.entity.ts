/**
 * Movie Domain Entity
 */

import { Movie, Media } from "@prisma/client";

/**
 * Movie with its associated media files
 */
export interface MovieWithFiles extends Movie {
  // The list of files associated with this movie
  // Mapped from 'medias' relation to 'media' property for API consistency
  media: Media[];
}

/**
 * Movie response type
 */
export type MovieResponse = MovieWithFiles;

/**
 * Movies list response type
 */
export type MoviesListResponse = MovieWithFiles[];
