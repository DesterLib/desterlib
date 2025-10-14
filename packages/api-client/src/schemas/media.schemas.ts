import { z } from "zod";

// ────────────────────────────────────────────────────────────────
// ENUMS
// ────────────────────────────────────────────────────────────────

export const MediaTypeSchema = z.enum(["MOVIE", "TV_SHOW", "MUSIC", "COMIC"]);

export const RoleTypeSchema = z.enum([
  "ACTOR",
  "DIRECTOR",
  "WRITER",
  "PRODUCER",
  "ARTIST",
  "COMPOSER",
  "AUTHOR",
]);

export const ExternalIdSourceSchema = z.enum([
  "TMDB",
  "IMDB",
  "TVDB",
  "ANIDB",
  "MYANIMELIST",
  "MUSICBRAINZ",
  "SPOTIFY",
  "COMICVINE",
  "OTHER",
]);

// ────────────────────────────────────────────────────────────────
// CORE SCHEMAS
// ────────────────────────────────────────────────────────────────

export const ExternalIdSchema = z.object({
  id: z.string(),
  source: ExternalIdSourceSchema,
  externalId: z.string(),
  mediaId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PersonSchema = z.object({
  id: z.string(),
  name: z.string(),
  bio: z.string().nullish(),
  birthDate: z.string().nullish(),
  profileUrl: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MediaPersonSchema = z.object({
  id: z.string(),
  role: RoleTypeSchema,
  mediaId: z.string(),
  personId: z.string(),
  character: z.string().nullish(),
  person: PersonSchema.optional(),
});

export const GenreSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MediaGenreSchema = z.object({
  id: z.string(),
  mediaId: z.string(),
  genreId: z.string(),
  genre: GenreSchema.optional(),
});

export const MediaCollectionSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string(),
    mediaId: z.string(),
    collectionId: z.string(),
    order: z.number().nullish(),
    collection: z.any().optional(), // Use z.any() to avoid circular dependency
  })
);

export const MovieSchema = z.object({
  id: z.string(),
  duration: z.number().nullish(),
  director: z.string().nullish(),
  trailerUrl: z.string().nullish(),
  filePath: z.string().nullish(),
  fileSize: z.union([z.string(), z.number()]).nullish(),
  fileModifiedAt: z.string().nullish(),
  mediaId: z.string(),
});

export const EpisodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  number: z.number(),
  duration: z.number().nullish(),
  airDate: z.string().nullish(),
  filePath: z.string().nullish(),
  fileSize: z.union([z.string(), z.number()]).nullish(),
  fileModifiedAt: z.string().nullish(),
  seasonId: z.string(),
  streamUrl: z.string().optional(),
});

export const SeasonSchema = z.object({
  id: z.string(),
  number: z.number(),
  episodes: z.array(EpisodeSchema).optional(),
  tvShowId: z.string(),
});

export const TVShowSchema = z.object({
  id: z.string(),
  seasons: z.array(SeasonSchema).optional(),
  creator: z.string().nullish(),
  network: z.string().nullish(),
  mediaId: z.string(),
});

export const MusicSchema = z.object({
  id: z.string(),
  artist: z.string(),
  album: z.string().nullish(),
  genre: z.string().nullish(),
  duration: z.number().nullish(),
  filePath: z.string().nullish(),
  fileSize: z.union([z.string(), z.number()]).nullish(),
  fileModifiedAt: z.string().nullish(),
  mediaId: z.string(),
});

export const ComicSchema = z.object({
  id: z.string(),
  issue: z.number().nullish(),
  volume: z.string().nullish(),
  publisher: z.string().nullish(),
  pages: z.number().nullish(),
  filePath: z.string().nullish(),
  fileSize: z.union([z.string(), z.number()]).nullish(),
  fileModifiedAt: z.string().nullish(),
  mediaId: z.string(),
});

export const MediaSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: MediaTypeSchema,
  description: z.string().nullish(),
  posterUrl: z.string().nullish(),
  backdropUrl: z.string().nullish(),
  releaseDate: z.string().nullish(),
  rating: z.number().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
  movie: MovieSchema.nullable(),
  tvShow: TVShowSchema.nullable(),
  music: MusicSchema.nullable(),
  comic: ComicSchema.nullable(),
  people: z.array(MediaPersonSchema).optional(),
  genres: z.array(MediaGenreSchema).optional(),
  externalIds: z.array(ExternalIdSchema).optional(),
  collections: z.array(MediaCollectionSchema).optional(),
});

// ────────────────────────────────────────────────────────────────
// REQUEST SCHEMAS
// ────────────────────────────────────────────────────────────────

export const MediaFiltersSchema = z.object({
  type: MediaTypeSchema.optional(),
  search: z.string().optional(),
  genreId: z.string().optional(),
  personId: z.string().optional(),
  collectionId: z.string().optional(),
  minRating: z.number().optional(),
  maxRating: z.number().optional(),
  releasedAfter: z.union([z.date(), z.string()]).optional(),
  releasedBefore: z.union([z.date(), z.string()]).optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
  sortBy: z.enum(["title", "releaseDate", "rating", "createdAt"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

// ────────────────────────────────────────────────────────────────
// RESPONSE SCHEMAS
// ────────────────────────────────────────────────────────────────

export const PaginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasMore: z.boolean(),
});

export const MediaListResponseSchema = z.object({
  message: z.string(),
  media: z.array(MediaSchema),
  pagination: PaginationSchema.optional(),
});

export const MediaResponseSchema = z.object({
  message: z.string(),
  media: MediaSchema,
});

export const SeasonResponseSchema = z.object({
  message: z.string(),
  season: SeasonSchema,
});

export const EpisodeResponseSchema = z.object({
  message: z.string(),
  episode: EpisodeSchema,
});

export const StatisticsResponseSchema = z.object({
  message: z.string(),
  statistics: z.record(z.number()),
});

// ────────────────────────────────────────────────────────────────
// INFERRED TYPES
// ────────────────────────────────────────────────────────────────

// Enums
export type MediaType = z.infer<typeof MediaTypeSchema>;
export type RoleType = z.infer<typeof RoleTypeSchema>;
export type ExternalIdSource = z.infer<typeof ExternalIdSourceSchema>;

// Core entities
export type ExternalId = z.infer<typeof ExternalIdSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type MediaPerson = z.infer<typeof MediaPersonSchema>;
export type Genre = z.infer<typeof GenreSchema>;
export type MediaGenre = z.infer<typeof MediaGenreSchema>;
export type MediaCollection = z.infer<typeof MediaCollectionSchema>;

// Media types
export type Media = z.infer<typeof MediaSchema>;
export type Movie = z.infer<typeof MovieSchema>;
export type TVShow = z.infer<typeof TVShowSchema>;
export type Season = z.infer<typeof SeasonSchema>;
export type Episode = z.infer<typeof EpisodeSchema>;
export type Music = z.infer<typeof MusicSchema>;
export type Comic = z.infer<typeof ComicSchema>;

// Request/Response types
export type MediaFilters = z.infer<typeof MediaFiltersSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type MediaListResponse = z.infer<typeof MediaListResponseSchema>;
export type MediaResponse = z.infer<typeof MediaResponseSchema>;
export type SeasonResponse = z.infer<typeof SeasonResponseSchema>;
export type EpisodeResponse = z.infer<typeof EpisodeResponseSchema>;
export type StatisticsResponse = z.infer<typeof StatisticsResponseSchema>;
