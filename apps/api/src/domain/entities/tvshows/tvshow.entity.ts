/**
 * TV Show Domain Entity
 */

import { TVShow, Season, Episode, MediaItem } from "@prisma/client";

/**
 * TV Show (metadata is now on TVShow itself)
 */
export type TVShowWithMedia = TVShow;

/**
 * Episode with file info
 */
export interface EpisodeWithMedia extends Episode {
  mediaItems: MediaItem[];
}

/**
 * Season with episodes
 */
export interface SeasonWithEpisodes extends Season {
  episodes: EpisodeWithMedia[];
}

/**
 * TV Show with seasons
 */
export interface TVShowWithSeasons extends TVShow {
  seasons: SeasonWithEpisodes[];
}

/**
 * TV Show response type
 */
export type TVShowResponse = TVShowWithSeasons;

/**
 * TV Shows list response type
 */
export type TVShowsListResponse = TVShow[];
