#!/usr/bin/env node

/**
 * Generate Test Library Script
 *
 * This script creates a dummy library of movies and TV shows using TMDB API
 * and clones a sample video file across all entries.
 *
 * Usage:
 *   node scripts/generate-test-library.js <source-video-path> <output-directory>
 *
 * Example:
 *   node scripts/generate-test-library.js /path/to/video.mp4 /path/to/test-library
 */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TMDB_API_KEY = process.env.TMDB_API_KEY || "";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const MOVIES_COUNT = parseInt(process.env.MOVIES_COUNT || "50", 10);
const TV_SHOWS_COUNT = parseInt(process.env.TV_SHOWS_COUNT || "50", 10);
const MAX_SEASONS_PER_SHOW = 3; // Limit seasons to keep size manageable
const MAX_EPISODES_PER_SEASON = 5; // Limit episodes per season
const API_DELAY_MS = 250; // Delay between API calls to avoid rate limiting

// ANSI color codes for pretty output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  blue: "\x1b[34m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length < 2) {
  log(
    "Usage: node generate-test-library.js <source-video-path> <output-directory>",
    "red"
  );
  log(
    "Example: node generate-test-library.js /Users/alken/Downloads/video.mp4 /tmp/test-library",
    "yellow"
  );
  process.exit(1);
}

const [sourceVideoPath, outputDirectory] = args;

// Validate API key
if (!TMDB_API_KEY) {
  log("Error: TMDB_API_KEY environment variable not set!", "red");
  log("Please set it before running this script:", "yellow");
  log("  export TMDB_API_KEY=your_api_key_here", "cyan");
  log("  Or add it to your .env file", "cyan");
  process.exit(1);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch data from TMDB API with retry logic
 */
async function fetchFromTMDB(endpoint, retries = 3) {
  const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}api_key=${TMDB_API_KEY}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sleep(API_DELAY_MS); // Rate limiting
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait longer and retry
          log("Rate limited, waiting 2 seconds...", "yellow");
          await sleep(2000);
          continue;
        }
        throw new Error(
          `TMDB API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries) {
        log(
          `Error fetching from TMDB after ${retries} attempts: ${error.message}`,
          "red"
        );
        throw error;
      }
      log(`Attempt ${attempt} failed, retrying...`, "yellow");
      await sleep(1000 * attempt); // Exponential backoff
    }
  }
}

/**
 * Fetch popular movies from TMDB
 */
async function fetchMovies(count) {
  log(`\nFetching ${count} popular movies from TMDB...`, "blue");
  const movies = [];
  const pages = Math.ceil(count / 20); // TMDB returns 20 items per page

  for (let page = 1; page <= pages && movies.length < count; page++) {
    const data = await fetchFromTMDB(`/movie/popular?page=${page}`);
    movies.push(...data.results.slice(0, count - movies.length));
  }

  log(`✓ Fetched ${movies.length} movies`, "green");
  return movies.slice(0, count);
}

/**
 * Fetch popular TV shows from TMDB
 */
async function fetchTVShows(count) {
  log(`\nFetching ${count} popular TV shows from TMDB...`, "blue");
  const shows = [];
  const pages = Math.ceil(count / 20);

  for (let page = 1; page <= pages && shows.length < count; page++) {
    const data = await fetchFromTMDB(`/tv/popular?page=${page}`);
    shows.push(...data.results.slice(0, count - shows.length));
  }

  log(`✓ Fetched ${shows.length} TV shows`, "green");
  return shows.slice(0, count);
}

/**
 * Clean filename to be filesystem-safe
 */
function cleanFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, "") // Remove invalid characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Create movie library
 */
async function createMovieLibrary(movies, moviesDir) {
  log(`\nCreating movie library in ${moviesDir}...`, "blue");
  await fs.mkdir(moviesDir, { recursive: true });

  let created = 0;
  for (const movie of movies) {
    try {
      const year = movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "Unknown";
      const cleanTitle = cleanFilename(movie.title);
      const filename = `${cleanTitle} {tmdb-${movie.id}} (${year}).mp4`;
      const targetPath = path.join(moviesDir, filename);

      // Copy the source video file
      await fs.copyFile(sourceVideoPath, targetPath);
      created++;

      if (created % 10 === 0) {
        log(`  Created ${created}/${movies.length} movies...`, "cyan");
      }
    } catch (error) {
      log(`  ✗ Error creating ${movie.title}: ${error.message}`, "red");
    }
  }

  log(`✓ Created ${created} movie files`, "green");
}

/**
 * Create TV show library
 */
async function createTVShowLibrary(shows, tvShowsDir) {
  log(`\nCreating TV show library in ${tvShowsDir}...`, "blue");
  await fs.mkdir(tvShowsDir, { recursive: true });

  let created = 0;
  let totalEpisodes = 0;

  for (const show of shows) {
    try {
      const cleanTitle = cleanFilename(show.name);
      const showDir = path.join(tvShowsDir, `${cleanTitle} {tmdb-${show.id}}`);

      // Create show directory
      await fs.mkdir(showDir, { recursive: true });

      // Fetch show details to get number of seasons
      const showDetails = await fetchFromTMDB(`/tv/${show.id}`);
      const numSeasons = Math.min(
        showDetails.number_of_seasons || 2,
        MAX_SEASONS_PER_SHOW
      );

      // Create seasons and episodes
      for (let season = 1; season <= numSeasons; season++) {
        const seasonDir = path.join(
          showDir,
          `Season ${season.toString().padStart(2, "0")}`
        );
        await fs.mkdir(seasonDir, { recursive: true });

        // Fetch season details to get episodes
        const seasonDetails = await fetchFromTMDB(
          `/tv/${show.id}/season/${season}`
        );
        const episodes = seasonDetails.episodes || [];

        // Create limited episodes per season to keep it manageable
        const episodesToCreate = Math.min(
          episodes.length,
          MAX_EPISODES_PER_SEASON
        );

        for (let ep = 1; ep <= episodesToCreate; ep++) {
          const episodeNum = ep.toString().padStart(2, "0");
          const seasonNum = season.toString().padStart(2, "0");
          const filename = `${cleanTitle} - S${seasonNum}E${episodeNum}.mp4`;
          const targetPath = path.join(seasonDir, filename);

          await fs.copyFile(sourceVideoPath, targetPath);
          totalEpisodes++;
        }
      }

      created++;
      if (created % 5 === 0) {
        log(
          `  Created ${created}/${shows.length} shows (${totalEpisodes} episodes)...`,
          "cyan"
        );
      }
    } catch (error) {
      log(`  ✗ Error creating ${show.name}: ${error.message}`, "red");
    }
  }

  log(`✓ Created ${created} TV shows with ${totalEpisodes} episodes`, "green");
}

/**
 * Main function
 */
async function main() {
  log("=".repeat(60), "bright");
  log("Test Library Generator for Desterlib", "bright");
  log("=".repeat(60), "bright");

  // Validate source video
  try {
    await fs.access(sourceVideoPath);
  } catch (error) {
    log(`\nError: Source video file not found: ${sourceVideoPath}`, "red");
    process.exit(1);
  }

  const stats = await fs.stat(sourceVideoPath);
  log(`\nSource video: ${sourceVideoPath}`, "cyan");
  log(`Size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`, "cyan");
  log(`Output directory: ${outputDirectory}`, "cyan");

  // Create output directory
  await fs.mkdir(outputDirectory, { recursive: true });

  try {
    // Fetch data from TMDB
    const movies = await fetchMovies(MOVIES_COUNT);
    const tvShows = await fetchTVShows(TV_SHOWS_COUNT);

    // Create subdirectories
    const moviesDir = path.join(outputDirectory, "Movies");
    const tvShowsDir = path.join(outputDirectory, "TV Shows");

    // Create movie library
    await createMovieLibrary(movies, moviesDir);

    // Create TV show library
    await createTVShowLibrary(tvShows, tvShowsDir);

    log("\n" + "=".repeat(60), "bright");
    log("✓ Test library created successfully!", "green");
    log("=".repeat(60), "bright");
    log(`\nTo scan this library in Desterlib:`, "yellow");
    log(`  1. Movies: ${moviesDir}`, "cyan");
    log(`  2. TV Shows: ${tvShowsDir}`, "cyan");
    log(
      `\nUse the scan functionality in the app to add these to your library.`,
      "yellow"
    );
  } catch (error) {
    log(`\n✗ Fatal error: ${error.message}`, "red");
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  log(`\n✗ Unhandled error: ${error.message}`, "red");
  console.error(error);
  process.exit(1);
});
