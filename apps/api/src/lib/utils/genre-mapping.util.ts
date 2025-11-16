/**
 * Simple Genre Normalization
 * Maps provider-specific genre names to canonical names
 */
const GENRE_NAME_MAP: Record<string, string> = {
  // Sci-Fi variations
  "sci-fi": "Science Fiction",
  scifi: "Science Fiction",
  "science fiction": "Science Fiction",
  "science fiction & fantasy": "Science Fiction",
  "sci-fi & fantasy": "Science Fiction",

  // Action variations
  action: "Action",
  "action & adventure": "Action",
  "action/adventure": "Action",

  // Others
  adventure: "Adventure",
  animation: "Animation",
  comedy: "Comedy",
  crime: "Crime",
  documentary: "Documentary",
  drama: "Drama",
  family: "Family",
  fantasy: "Fantasy",
  history: "History",
  horror: "Horror",
  music: "Music",
  mystery: "Mystery",
  romance: "Romance",
  thriller: "Thriller",
  war: "War",
  western: "Western",

  // TV specific
  kids: "Kids",
  news: "News",
  reality: "Reality",
  soap: "Soap",
  talk: "Talk",
  "war & politics": "War",
  "game show": "Game Show",
};

/**
 * Normalize a genre name from a provider to canonical name
 */
export function normalizeGenreName(genreName: string): string {
  const normalized = genreName.toLowerCase().trim();
  return GENRE_NAME_MAP[normalized] || genreName; // Return original if no mapping found
}

/**
 * Create a slug from genre name
 */
export function createGenreSlug(genreName: string): string {
  return genreName.toLowerCase().replace(/\s+/g, "-");
}

/**
 * Normalize genres from any provider and remove duplicates
 */
export function normalizeGenres(
  genres: Array<{ id: number | string; name: string }>,
): Array<{ name: string; slug: string }> {
  const uniqueGenres = new Map<string, { name: string; slug: string }>();

  for (const genre of genres) {
    const canonicalName = normalizeGenreName(genre.name);
    const slug = createGenreSlug(canonicalName);

    // Use slug as key to prevent duplicates
    if (!uniqueGenres.has(slug)) {
      uniqueGenres.set(slug, { name: canonicalName, slug });
    }
  }

  return Array.from(uniqueGenres.values());
}
