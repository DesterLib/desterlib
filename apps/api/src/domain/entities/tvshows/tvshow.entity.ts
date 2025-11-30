/**
 * TV Show Domain Entity
 */

import { TVShow, Media, Season, Episode } from "@prisma/client";

/**
 * TV Show with its associated media information
 */
export interface TVShowWithMedia extends TVShow {
  media: Media;
}

/**
 * Season with episodes
 */
export interface SeasonWithEpisodes extends Season {
  episodes: Episode[];
}

/**
 * TV Show with seasons and media
 */
export interface TVShowWithSeasonsAndMedia extends TVShow {
  media: Media;
  seasons: SeasonWithEpisodes[];
}

/**
 * TV Show response type (includes seasons and episodes for detail view)
 */
export type TVShowResponse = TVShowWithSeasonsAndMedia;

/**
 * TV Shows list response type
 */
export type TVShowsListResponse = TVShowWithMedia[];
