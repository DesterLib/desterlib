/**
 * Movie types and interfaces
 */

import { Movie, Media } from "../../../../generated/prisma";

/**
 * Movie with its associated media information
 */
export interface MovieWithMedia extends Movie {
  media: Media;
}

/**
 * Movie response type (same as MovieWithMedia but explicitly for API responses)
 */
export type MovieResponse = MovieWithMedia;

/**
 * Movies list response type
 */
export type MoviesListResponse = MovieWithMedia[];
