/**
 * Test Utilities
 *
 * Helper functions for testing
 */

import { MediaType } from "../../generated/prisma/index.js";
import { prisma } from "../../lib/prisma.js";

/**
 * Create a test collection
 */
export async function createTestCollection(overrides?: {
  name?: string;
  slug?: string;
  isLibrary?: boolean;
  libraryPath?: string;
  libraryType?: MediaType;
}) {
  const uniqueId = Math.random().toString(36).substring(7);
  return prisma.collection.create({
    data: {
      name: overrides?.name || `Test Collection ${uniqueId}`,
      slug: overrides?.slug || `test-collection-${uniqueId}`,
      isLibrary: overrides?.isLibrary || false,
      libraryPath: overrides?.libraryPath,
      libraryType: overrides?.libraryType,
    },
  });
}

/**
 * Create test media
 */
export async function createTestMedia(
  type: MediaType,
  overrides?: {
    title?: string;
    description?: string;
    posterUrl?: string;
    releaseDate?: Date;
    rating?: number;
  }
) {
  const uniqueId = Math.random().toString(36).substring(7);
  return prisma.media.create({
    data: {
      title: overrides?.title || `Test Media ${uniqueId}`,
      type,
      description: overrides?.description,
      posterUrl: overrides?.posterUrl,
      releaseDate: overrides?.releaseDate,
      rating: overrides?.rating,
    },
  });
}

/**
 * Create test movie
 */
export async function createTestMovie(overrides?: {
  title?: string;
  duration?: number;
  director?: string;
  filePath?: string;
}) {
  const uniqueId = Math.random().toString(36).substring(7);
  const media = await createTestMedia(MediaType.MOVIE, {
    title: overrides?.title || `Test Movie ${uniqueId}`,
  });

  return prisma.movie.create({
    data: {
      mediaId: media.id,
      duration: overrides?.duration || 120,
      director: overrides?.director || "Test Director",
      filePath: overrides?.filePath || `/test/movie-${uniqueId}.mp4`,
    },
    include: {
      media: true,
    },
  });
}

/**
 * Create test TV show with seasons and episodes
 */
export async function createTestTVShow(overrides?: {
  title?: string;
  creator?: string;
  seasonCount?: number;
  episodeCount?: number;
}) {
  const media = await createTestMedia(MediaType.TV_SHOW, {
    title: overrides?.title || "Test TV Show",
  });

  const tvShow = await prisma.tVShow.create({
    data: {
      mediaId: media.id,
      creator: overrides?.creator || "Test Creator",
    },
  });

  const seasonCount = overrides?.seasonCount || 1;
  const episodeCount = overrides?.episodeCount || 1;

  for (let s = 1; s <= seasonCount; s++) {
    const season = await prisma.season.create({
      data: {
        tvShowId: tvShow.id,
        number: s,
      },
    });

    for (let e = 1; e <= episodeCount; e++) {
      await prisma.episode.create({
        data: {
          seasonId: season.id,
          number: e,
          title: `Episode ${e}`,
          duration: 45,
          filePath: `/test/s${s}e${e}.mp4`,
        },
      });
    }
  }

  return prisma.tVShow.findUnique({
    where: { id: tvShow.id },
    include: {
      media: true,
      seasons: {
        include: {
          episodes: true,
        },
      },
    },
  });
}

/**
 * Create test genre
 */
export async function createTestGenre(overrides?: {
  name?: string;
  slug?: string;
}) {
  return prisma.genre.create({
    data: {
      name: overrides?.name || "Test Genre",
      slug: overrides?.slug || "test-genre",
    },
  });
}

/**
 * Create test person
 */
export async function createTestPerson(overrides?: { name?: string }) {
  return prisma.person.create({
    data: {
      name: overrides?.name || "Test Person",
    },
  });
}

/**
 * Create test settings
 */
export async function createTestSettings(overrides?: {
  isSetupComplete?: boolean;
  tmdbApiKey?: string;
}) {
  return prisma.settings.create({
    data: {
      id: "default",
      isSetupComplete: overrides?.isSetupComplete ?? false,
      tmdbApiKey: overrides?.tmdbApiKey,
    },
  });
}

/**
 * Mock express request
 */
export function mockRequest(overrides?: {
  body?: unknown;
  params?: Record<string, string>;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}) {
  return {
    body: overrides?.body || {},
    params: overrides?.params || {},
    query: overrides?.query || {},
    headers: overrides?.headers || {},
    header: (name: string) => overrides?.headers?.[name],
    context: {
      requestId: "test-request-id",
      startTimeMs: Date.now(),
    },
  };
}

/**
 * Mock express response
 */
export function mockResponse() {
  const res: {
    status: (code: number) => typeof res;
    json: (data: unknown) => typeof res;
    jsonOk: <T>(data: T, statusCode?: number) => void;
    setHeader: (name: string, value: string) => typeof res;
    getHeader: (name: string) => string | undefined;
    send: (data: unknown) => typeof res;
    _statusCode?: number;
    _jsonData?: unknown;
    _headers: Record<string, string>;
  } = {
    _statusCode: undefined,
    _jsonData: undefined,
    _headers: {},
    status(code: number) {
      this._statusCode = code;
      return this;
    },
    json(data: unknown) {
      this._jsonData = data;
      return this;
    },
    jsonOk<T>(data: T, statusCode = 200) {
      this._statusCode = statusCode;
      this._jsonData = {
        success: true,
        requestId: this.getHeader("x-request-id") || "test-request-id",
        data,
      };
    },
    setHeader(name: string, value: string) {
      this._headers[name] = value;
      return this;
    },
    getHeader(name: string) {
      return this._headers[name];
    },
    send(data: unknown) {
      this._jsonData = data;
      return this;
    },
  };

  res.setHeader("x-request-id", "test-request-id");

  return res;
}

/**
 * Mock express next function
 */
export function mockNext() {
  return vi.fn();
}
