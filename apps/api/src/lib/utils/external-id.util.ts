export interface ExtractedIds {
  tmdbId?: string;
  imdbId?: string;
  tvdbId?: string;
  year?: string;
  title?: string;
  season?: number;
  episode?: number;
}

export function extractIds(name: string): ExtractedIds {
  const result: ExtractedIds = {};

  // Extract TMDB ID: {tmdb-12345} or tmdb-12345 or [tmdb-12345]
  const tmdbMatch = name.match(/[[{]?tmdb[:-](\d+)[\]}]?/i);
  if (tmdbMatch) result.tmdbId = tmdbMatch[1];

  // Extract IMDB ID: {imdb-tt1234567} or imdb-tt1234567
  const imdbMatch = name.match(/[[{]?imdb[:-](tt\d+)[\]}]?/i);
  if (imdbMatch) result.imdbId = imdbMatch[1];

  // Extract TVDB ID: {tvdb-12345}
  const tvdbMatch = name.match(/[[{]?tvdb[:-](\d+)[\]}]?/i);
  if (tvdbMatch) result.tvdbId = tvdbMatch[1];

  // Extract year: (2023) or [2023]
  const yearMatch = name.match(/[[(](\d{4})[\])]/);
  if (yearMatch) result.year = yearMatch[1];

  // Extract season and episode: S01E01, s01e01, 1x01, Season 01, etc.
  const seasonEpisodeMatch = name.match(/[Ss](\d{1,2})[Ee](\d{1,2})/);
  if (seasonEpisodeMatch && seasonEpisodeMatch[1] && seasonEpisodeMatch[2]) {
    result.season = parseInt(seasonEpisodeMatch[1], 10);
    result.episode = parseInt(seasonEpisodeMatch[2], 10);
  } else {
    // Try alternative format: 1x01
    const altMatch = name.match(/(\d{1,2})x(\d{1,2})/);
    if (altMatch && altMatch[1] && altMatch[2]) {
      result.season = parseInt(altMatch[1], 10);
      result.episode = parseInt(altMatch[2], 10);
    } else {
      // Try Season XX format
      const seasonOnlyMatch = name.match(/[Ss]eason\s*(\d{1,2})/i);
      if (seasonOnlyMatch && seasonOnlyMatch[1]) {
        result.season = parseInt(seasonOnlyMatch[1], 10);
      }
    }
  }

  // Clean title (remove IDs, year, season/episode info, and common patterns)
  const cleanTitle = name
    .replace(/[[{]?(tmdb|imdb|tvdb)[:-][\w\d]+[\]}]?/gi, "")
    .replace(/[[(]\d{4}[\])]/, "")
    .replace(/[Ss]\d{1,2}[Ee]\d{1,2}/g, "")
    .replace(/\d{1,2}x\d{1,2}/g, "")
    .replace(/[Ss]eason\s*\d{1,2}/gi, "")
    .replace(/\.(mkv|mp4|avi|mov|wmv|m4v)$/i, "")
    .replace(/[._-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  result.title = cleanTitle;

  return result;
}

export default extractIds;
