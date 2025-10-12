import { ExternalIdSource } from "../../generated/prisma/index.js";
import type { ParsedExternalId } from "./types.js";

/**
 * Map of external ID source names to ExternalIdSource enum values
 * Supports both lowercase and uppercase formats
 */
const SOURCE_MAP: Record<string, ExternalIdSource> = {
  tmdb: ExternalIdSource.TMDB,
  imdb: ExternalIdSource.IMDB,
  tvdb: ExternalIdSource.TVDB,
  anidb: ExternalIdSource.ANIDB,
  myanimelist: ExternalIdSource.MYANIMELIST,
  mal: ExternalIdSource.MYANIMELIST, // alias
  musicbrainz: ExternalIdSource.MUSICBRAINZ,
  mb: ExternalIdSource.MUSICBRAINZ, // alias
  spotify: ExternalIdSource.SPOTIFY,
  comicvine: ExternalIdSource.COMICVINE,
  cv: ExternalIdSource.COMICVINE, // alias
};

/**
 * Parse external IDs from a string in Plex format: {source-id}
 *
 * Examples:
 * - {tmdb-232252} -> { source: TMDB, id: "232252" }
 * - {imdb-tt1234567} -> { source: IMDB, id: "tt1234567" }
 * - Movie Name {tmdb-12345} (2023).mkv -> extracts {tmdb-12345}
 *
 * Can extract multiple IDs from a single string:
 * - Movie {tmdb-123} {imdb-tt456}.mkv -> returns both IDs
 */
export function parseExternalIds(text: string): ParsedExternalId[] {
  const results: ParsedExternalId[] = [];

  // Match all occurrences of {source-id} pattern
  // Pattern: { followed by alphanumeric source, dash, and alphanumeric id, ending with }
  const regex = /\{([a-zA-Z0-9]+)-([a-zA-Z0-9]+)\}/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const [raw, sourceName, id] = match;

    if (!sourceName || !id) continue;

    // Normalize source name to lowercase for lookup
    const normalizedSource = sourceName.toLowerCase();
    const source = SOURCE_MAP[normalizedSource];

    if (source) {
      results.push({
        source,
        id,
        raw: raw!,
      });
    }
  }

  return results;
}

/**
 * Parse a single external ID from text
 * Returns the first match found, or null if none found
 */
export function parseFirstExternalId(text: string): ParsedExternalId | null {
  const ids = parseExternalIds(text);
  return ids.length > 0 ? ids[0]! : null;
}

/**
 * Extract external ID of a specific source from text
 * Returns the first ID matching the specified source
 */
export function parseExternalIdBySource(
  text: string,
  source: ExternalIdSource
): ParsedExternalId | null {
  const ids = parseExternalIds(text);
  return ids.find((id) => id.source === source) ?? null;
}

/**
 * Check if text contains any external IDs
 */
export function hasExternalIds(text: string): boolean {
  return parseExternalIds(text).length > 0;
}

/**
 * Remove all external ID tags from text
 * Example: "Movie Name {tmdb-123} (2023).mkv" -> "Movie Name  (2023).mkv"
 */
export function removeExternalIds(text: string): string {
  return text.replace(/\{[a-zA-Z0-9]+-[a-zA-Z0-9]+\}/g, "");
}

/**
 * Format an external ID to Plex format
 * Example: formatExternalId(ExternalIdSource.TMDB, "232252") -> "{tmdb-232252}"
 */
export function formatExternalId(source: ExternalIdSource, id: string): string {
  // Find the source name by value
  const sourceName = Object.entries(SOURCE_MAP).find(
    ([_, value]) => value === source
  )?.[0];

  if (!sourceName) {
    // Fallback to enum name in lowercase
    return `{${source.toLowerCase()}-${id}}`;
  }

  return `{${sourceName}-${id}}`;
}

/**
 * Validate if a string is a properly formatted external ID
 */
export function isValidExternalIdFormat(text: string): boolean {
  const regex = /^\{[a-zA-Z0-9]+-[a-zA-Z0-9]+\}$/;
  return regex.test(text);
}
