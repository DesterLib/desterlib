/**
 * Genre mapping configuration
 *
 * This file centralizes genre name normalization across different metadata providers.
 * Each provider may return genre names in different formats, and this mapping ensures
 * consistency in the database.
 *
 * Example:
 * - TMDB might return "Science Fiction"
 * - Another provider might return "Sci-Fi"
 * - Both should map to "Science Fiction" in our database
 */

/**
 * Normalized genre names used in the database
 * These are the canonical genre names we use across the application
 */
export const NORMALIZED_GENRES = {
  // Movies & TV Shows
  ACTION: "Action",
  ADVENTURE: "Adventure",
  ANIMATION: "Animation",
  COMEDY: "Comedy",
  CRIME: "Crime",
  DOCUMENTARY: "Documentary",
  DRAMA: "Drama",
  FAMILY: "Family",
  FANTASY: "Fantasy",
  HISTORY: "History",
  HORROR: "Horror",
  MUSIC: "Music",
  MYSTERY: "Mystery",
  ROMANCE: "Romance",
  SCIENCE_FICTION: "Science Fiction",
  TV_MOVIE: "TV Movie",
  THRILLER: "Thriller",
  WAR: "War",
  WESTERN: "Western",

  // TV Specific
  ACTION_ADVENTURE: "Action & Adventure",
  KIDS: "Kids",
  NEWS: "News",
  REALITY: "Reality",
  SOAP: "Soap",
  TALK: "Talk",
  WAR_POLITICS: "War & Politics",

  // Comics
  SUPERHERO: "Superhero",
  MANGA: "Manga",
  GRAPHIC_NOVEL: "Graphic Novel",

  // Music
  ROCK: "Rock",
  POP: "Pop",
  JAZZ: "Jazz",
  CLASSICAL: "Classical",
  ELECTRONIC: "Electronic",
  HIP_HOP: "Hip Hop",
  METAL: "Metal",
  COUNTRY: "Country",
  BLUES: "Blues",
  FOLK: "Folk",
  REGGAE: "Reggae",
  RNB: "R&B",
  INDIE: "Indie",
  ALTERNATIVE: "Alternative",
  PUNK: "Punk",
} as const;

/**
 * Genre mapping table
 * Maps various genre name variations to their normalized form
 *
 * Key: lowercase version of what providers might return
 * Value: normalized genre name from NORMALIZED_GENRES
 */
export const GENRE_MAPPING: Record<string, string> = {
  // Action variations
  action: NORMALIZED_GENRES.ACTION,

  // Adventure variations
  adventure: NORMALIZED_GENRES.ADVENTURE,

  // Animation variations
  animation: NORMALIZED_GENRES.ANIMATION,
  animated: NORMALIZED_GENRES.ANIMATION,

  // Comedy variations
  comedy: NORMALIZED_GENRES.COMEDY,

  // Crime variations
  crime: NORMALIZED_GENRES.CRIME,

  // Documentary variations
  documentary: NORMALIZED_GENRES.DOCUMENTARY,
  documentaries: NORMALIZED_GENRES.DOCUMENTARY,

  // Drama variations
  drama: NORMALIZED_GENRES.DRAMA,

  // Family variations
  family: NORMALIZED_GENRES.FAMILY,

  // Fantasy variations
  fantasy: NORMALIZED_GENRES.FANTASY,

  // History variations
  history: NORMALIZED_GENRES.HISTORY,
  historical: NORMALIZED_GENRES.HISTORY,

  // Horror variations
  horror: NORMALIZED_GENRES.HORROR,

  // Music variations
  music: NORMALIZED_GENRES.MUSIC,
  musical: NORMALIZED_GENRES.MUSIC,

  // Mystery variations
  mystery: NORMALIZED_GENRES.MYSTERY,

  // Romance variations
  romance: NORMALIZED_GENRES.ROMANCE,
  romantic: NORMALIZED_GENRES.ROMANCE,

  // Science Fiction variations
  "science fiction": NORMALIZED_GENRES.SCIENCE_FICTION,
  "sci-fi": NORMALIZED_GENRES.SCIENCE_FICTION,
  scifi: NORMALIZED_GENRES.SCIENCE_FICTION,
  "science-fiction": NORMALIZED_GENRES.SCIENCE_FICTION,

  // TV Movie
  "tv movie": NORMALIZED_GENRES.TV_MOVIE,

  // Thriller variations
  thriller: NORMALIZED_GENRES.THRILLER,

  // War variations
  war: NORMALIZED_GENRES.WAR,

  // Western variations
  western: NORMALIZED_GENRES.WESTERN,

  // TV Specific
  "action & adventure": NORMALIZED_GENRES.ACTION_ADVENTURE,
  "action and adventure": NORMALIZED_GENRES.ACTION_ADVENTURE,
  kids: NORMALIZED_GENRES.KIDS,
  children: NORMALIZED_GENRES.KIDS,
  news: NORMALIZED_GENRES.NEWS,
  reality: NORMALIZED_GENRES.REALITY,
  "reality-tv": NORMALIZED_GENRES.REALITY,
  soap: NORMALIZED_GENRES.SOAP,
  talk: NORMALIZED_GENRES.TALK,
  "war & politics": NORMALIZED_GENRES.WAR_POLITICS,
  "war and politics": NORMALIZED_GENRES.WAR_POLITICS,

  // Comics
  superhero: NORMALIZED_GENRES.SUPERHERO,
  "super hero": NORMALIZED_GENRES.SUPERHERO,
  "super-hero": NORMALIZED_GENRES.SUPERHERO,
  manga: NORMALIZED_GENRES.MANGA,
  "graphic novel": NORMALIZED_GENRES.GRAPHIC_NOVEL,

  // Music genres
  rock: NORMALIZED_GENRES.ROCK,
  pop: NORMALIZED_GENRES.POP,
  jazz: NORMALIZED_GENRES.JAZZ,
  classical: NORMALIZED_GENRES.CLASSICAL,
  electronic: NORMALIZED_GENRES.ELECTRONIC,
  "hip hop": NORMALIZED_GENRES.HIP_HOP,
  "hip-hop": NORMALIZED_GENRES.HIP_HOP,
  hiphop: NORMALIZED_GENRES.HIP_HOP,
  rap: NORMALIZED_GENRES.HIP_HOP,
  metal: NORMALIZED_GENRES.METAL,
  "heavy metal": NORMALIZED_GENRES.METAL,
  country: NORMALIZED_GENRES.COUNTRY,
  blues: NORMALIZED_GENRES.BLUES,
  folk: NORMALIZED_GENRES.FOLK,
  reggae: NORMALIZED_GENRES.REGGAE,
  "r&b": NORMALIZED_GENRES.RNB,
  rnb: NORMALIZED_GENRES.RNB,
  "rhythm and blues": NORMALIZED_GENRES.RNB,
  indie: NORMALIZED_GENRES.INDIE,
  alternative: NORMALIZED_GENRES.ALTERNATIVE,
  punk: NORMALIZED_GENRES.PUNK,
};

/**
 * Normalize a genre name to its canonical form
 *
 * @param genreName - The genre name from a metadata provider
 * @returns The normalized genre name, or the original if no mapping exists
 */
export function normalizeGenreName(genreName: string): string {
  const lowercased = genreName.toLowerCase().trim();
  return GENRE_MAPPING[lowercased] || genreName;
}

/**
 * Create a slug from a genre name
 *
 * @param genreName - The genre name
 * @returns A URL-friendly slug
 */
export function createGenreSlug(genreName: string): string {
  return genreName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
}
