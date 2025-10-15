/**
 * Test Setup
 *
 * Global setup for all tests. Runs before any test file.
 */

import { beforeAll, afterAll, beforeEach } from "vitest";
import { prisma } from "../lib/prisma.js";

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = "error"; // Reduce log noise in tests
process.env.DATABASE_URL = "file:./test.db";

/**
 * Clean up database before all tests
 */
beforeAll(async () => {
  // Ensure clean test database
  await cleanDatabase();
});

/**
 * Clean up after all tests
 */
afterAll(async () => {
  await prisma.$disconnect();
});

/**
 * Clean database before each test for isolation
 */
beforeEach(async () => {
  await cleanDatabase();
});

/**
 * Helper to clean all database tables
 */
async function cleanDatabase() {
  // Delete in correct order to respect foreign key constraints
  await prisma.mediaCollection.deleteMany({});
  await prisma.mediaGenre.deleteMany({});
  await prisma.mediaPerson.deleteMany({});
  await prisma.externalId.deleteMany({});

  await prisma.episode.deleteMany({});
  await prisma.season.deleteMany({});
  await prisma.tVShow.deleteMany({});
  await prisma.movie.deleteMany({});
  await prisma.music.deleteMany({});
  await prisma.comic.deleteMany({});

  await prisma.media.deleteMany({});
  await prisma.person.deleteMany({});
  await prisma.genre.deleteMany({});
  await prisma.collection.deleteMany({});
  await prisma.settings.deleteMany({});
}

/**
 * Export helper for tests to use
 */
export { cleanDatabase };
