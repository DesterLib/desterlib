export type TmdbType = "movie" | "tv" | "season" | "episode" | "person";

export interface TmdbEpisodeMetadata {
  name?: string;
  runtime?: number;
  air_date?: string;
  [key: string]: unknown;
}
