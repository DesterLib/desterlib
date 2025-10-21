export type TmdbType = "movie" | "tv" | "season" | "episode" | "person";

export interface TmdbEpisodeMetadata {
  name?: string;
  runtime?: number;
  air_date?: string;
  still_path?: string;
  [key: string]: unknown;
}
