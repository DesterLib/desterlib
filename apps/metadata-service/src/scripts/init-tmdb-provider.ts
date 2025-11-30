/**
 * Helper script to initialize TMDB provider in the database
 *
 * Usage:
 *   DATABASE_URL=postgres://... tsx src/scripts/init-tmdb-provider.ts <api_key>
 *
 * Or set TMDB_API_KEY environment variable:
 *   TMDB_API_KEY=your_key DATABASE_URL=postgres://... tsx src/scripts/init-tmdb-provider.ts
 */

import { Database } from "../database";
import { logger } from "@dester/logger";

async function main() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    "postgres://user:password@localhost/dester?sslmode=disable";

  const apiKey = process.argv[2] || process.env.TMDB_API_KEY;

  if (!apiKey) {
    console.error("Error: TMDB API key is required");
    console.error("Usage: tsx init-tmdb-provider.ts <api_key>");
    console.error("   or: TMDB_API_KEY=your_key tsx init-tmdb-provider.ts");
    process.exit(1);
  }

  const database = new Database(databaseUrl, logger);

  try {
    // Initialize providers table
    await database.initializeProvidersTable();

    // Create/update TMDB provider
    const provider = await database.upsertProvider(
      "tmdb",
      true, // enabled
      0, // priority (highest)
      {
        apiKey: apiKey,
        baseUrl: process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3",
        rateLimitRps: parseFloat(process.env.TMDB_RATE_LIMIT_RPS || "4"),
      }
    );

    logger.info(
      { provider: provider.name, id: provider.id },
      "TMDB provider configured successfully"
    );

    console.log("✅ TMDB provider configured successfully!");
    console.log(`   Provider ID: ${provider.id}`);
    console.log(`   Name: ${provider.name}`);
    console.log(`   Enabled: ${provider.enabled}`);
    console.log(`   Priority: ${provider.priority}`);
  } catch (error) {
    logger.error({ error }, "Failed to initialize TMDB provider");
    console.error("❌ Failed to initialize TMDB provider:", error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

main();
