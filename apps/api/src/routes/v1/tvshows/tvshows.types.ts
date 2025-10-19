/**
 * TV Show types and interfaces
 */

import { TVShow, Media } from "../../../../generated/prisma";

/**
 * TV Show with its associated media information
 */
export interface TVShowWithMedia extends TVShow {
  media: Media;
}

/**
 * TV Show response type (same as TVShowWithMedia but explicitly for API responses)
 */
export type TVShowResponse = TVShowWithMedia;

/**
 * TV Shows list response type
 */
export type TVShowsListResponse = TVShowWithMedia[];
