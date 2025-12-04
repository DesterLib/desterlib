import { Pool, PoolClient } from "pg";
import { Logger } from "@dester/logger";

export interface Media {
  id: string;
  title: string;
  description: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: Date | null;
  rating: number | null;
}

export interface MetadataProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  config: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export class Database {
  private pool: Pool;
  private logger: Logger;

  constructor(databaseUrl: string, logger: Logger) {
    this.pool = new Pool({ connectionString: databaseUrl });
    this.logger = logger;
  }

  async close() {
    await this.pool.end();
  }

  async isConnected(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      client.release();
      return true;
    } catch (error) {
      return false;
    }
  }

  // ... (Provider table methods kept as is) ...
  /**
   * Initialize metadata_providers table if it doesn't exist
   */
  async initializeProvidersTable(): Promise<void> {
    try {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS "MetadataProvider" (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          enabled BOOLEAN NOT NULL DEFAULT true,
          priority INTEGER NOT NULL DEFAULT 0,
          config JSONB NOT NULL DEFAULT '{}',
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_metadata_provider_enabled_priority 
        ON "MetadataProvider"(enabled, priority);
      `);
      this.logger.info("Metadata providers table initialized");
    } catch (error) {
      this.logger.error(
        { error },
        "Failed to initialize MetadataProvider table"
      );
      throw error;
    }
  }

  /**
   * Get all enabled metadata providers, ordered by priority
   */
  async getEnabledProviders(): Promise<MetadataProviderConfig[]> {
    const result = await this.pool.query<MetadataProviderConfig>(
      `SELECT id, name, enabled, priority, config, created_at, updated_at
       FROM "MetadataProvider"
       WHERE enabled = true
       ORDER BY priority ASC, name ASC`
    );

    return result.rows;
  }

  /**
   * Get a specific provider by name
   */
  async getProvider(name: string): Promise<MetadataProviderConfig | null> {
    const result = await this.pool.query<MetadataProviderConfig>(
      `SELECT id, name, enabled, priority, config, created_at, updated_at
       FROM "MetadataProvider"
       WHERE name = $1`,
      [name]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  /**
   * Create or update a provider configuration
   */
  async upsertProvider(
    name: string,
    enabled: boolean,
    priority: number,
    config: Record<string, any>
  ): Promise<MetadataProviderConfig> {
    const result = await this.pool.query<MetadataProviderConfig>(
      `INSERT INTO "MetadataProvider" (id, name, enabled, priority, config, updated_at)
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())
       ON CONFLICT (name)
       DO UPDATE SET
         enabled = EXCLUDED.enabled,
         priority = EXCLUDED.priority,
         config = EXCLUDED.config,
         updated_at = NOW()
       RETURNING id, name, enabled, priority, config, created_at, updated_at`,
      [name, enabled, priority, JSON.stringify(config)]
    );

    return result.rows[0];
  }

  // Updated to support dynamic table based on mediaType
  async updateMediaMetadata(
    mediaId: string,
    mediaType: string,
    metadata: {
      tmdbId: number;
      title: string;
      overview: string | null;
      posterUrl: string | null;
      nullPosterUrl: string | null;
      backdropUrl: string | null;
      nullBackdropUrl: string | null;
      logoUrl: string | null;
      releaseDate: Date | null;
      rating: number | null;
      genres: string[];
    }
  ) {
    const client: PoolClient = await this.pool.connect();

    // Determine table name based on type
    const tableName = mediaType === "TV_SHOW" ? "TVShow" : "Movie";
    // For TVShow, releaseDate is firstAirDate
    const dateField = mediaType === "TV_SHOW" ? "firstAirDate" : "releaseDate";

    try {
      await client.query("BEGIN");

      // Check if Media record exists first
      const mediaCheck = await client.query(
        `SELECT id FROM "${tableName}" WHERE id = $1`,
        [mediaId]
      );

      if (mediaCheck.rows.length === 0) {
        this.logger.warn(
          { mediaId, tableName },
          "Media record not found, skipping metadata update. This may be a stale job."
        );
        await client.query("ROLLBACK");
        const error = new Error(`Media record not found: ${mediaId}`);
        (error as any).code = "MEDIA_NOT_FOUND";
        throw error;
      }

      // Update Metadata
      await client.query(
        `UPDATE "${tableName}" SET
          title = $1,
          overview = $2,
          "posterUrl" = $3,
          "backdropUrl" = $4,
          "${dateField}" = $5,
          rating = $6,
          "nullPosterUrl" = $7,
          "nullBackdropUrl" = $8,
          "logoUrl" = $9,
          "updatedAt" = NOW()
         WHERE id = $10`,
        [
          metadata.title,
          metadata.overview,
          metadata.posterUrl,
          metadata.backdropUrl,
          metadata.releaseDate,
          metadata.rating,
          metadata.nullPosterUrl,
          metadata.nullBackdropUrl,
          metadata.logoUrl,
          mediaId,
        ]
      );

      // Add ExternalId (TMDB)
      try {
        // FK field name depends on table: movieId or tvShowId
        const idField = mediaType === "TV_SHOW" ? "tvShowId" : "movieId";

        await client.query(
          `INSERT INTO "ExternalId" (id, source, "externalId", "${idField}", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, 'TMDB', $1, $2, NOW(), NOW())
           ON CONFLICT (source, "externalId") 
           DO UPDATE SET
             "updatedAt" = NOW()`,
          [metadata.tmdbId.toString(), mediaId]
        );
      } catch (insertError: any) {
        // Log but assume ok if conflict handling worked
        if (insertError?.code !== "23505") {
          // Handle unique constraint violation if needed, but ON CONFLICT should handle it
          // Actually my query updates updatedAt on conflict of unique key.
          // If conflict is on something else, rethrow.
          throw insertError;
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async hasCompleteMetadata(
    mediaId: string,
    mediaType: string
  ): Promise<boolean> {
    const tableName = mediaType === "TV_SHOW" ? "TVShow" : "Movie";
    try {
      const result = await this.pool.query<{
        hasMetadata: boolean;
      }>(
        `SELECT 
          CASE 
            WHEN title IS NOT NULL 
            AND overview IS NOT NULL 
            AND ("posterUrl" IS NOT NULL OR "backdropUrl" IS NOT NULL)
            THEN true
            ELSE false
          END as "hasMetadata"
        FROM "${tableName}"
        WHERE id = $1`,
        [mediaId]
      );

      return result.rows[0]?.hasMetadata || false;
    } catch (error) {
      this.logger.warn(
        { error, mediaId },
        "Failed to check if media has complete metadata"
      );
      return false;
    }
  }

  async getMediaMetadata(
    mediaId: string,
    mediaType: string
  ): Promise<{
    posterUrl: string | null;
    backdropUrl: string | null;
    nullPosterUrl: string | null;
    nullBackdropUrl: string | null;
    hasExternalId: boolean;
  } | null> {
    const tableName = mediaType === "TV_SHOW" ? "TVShow" : "Movie";
    const idField = mediaType === "TV_SHOW" ? "tvShowId" : "movieId";

    try {
      const result = await this.pool.query<{
        posterUrl: string | null;
        backdropUrl: string | null;
        nullPosterUrl: string | null;
        nullBackdropUrl: string | null;
        hasExternalId: boolean;
      }>(
        `SELECT 
          m."posterUrl",
          m."backdropUrl",
          m."nullPosterUrl",
          m."nullBackdropUrl",
          CASE WHEN e.id IS NOT NULL THEN true ELSE false END as "hasExternalId"
        FROM "${tableName}" m
        LEFT JOIN "ExternalId" e ON e."${idField}" = m.id AND e.source = 'TMDB'
        WHERE m.id = $1`,
        [mediaId]
      );

      return result.rows[0] || null;
    } catch (error) {
      this.logger.warn(
        { error, mediaId },
        "Failed to get existing media metadata"
      );
      return null;
    }
  }

  // ScanJob methods remain mostly same as they use ScanJob table which hasn't changed
  // ...

  async updateMetadataStatus(
    libraryId: string,
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED" | "NOT_STARTED"
  ): Promise<void> {
    try {
      const updateFields: string[] = [
        `"metadataStatus" = $1::"MetadataJobStatus"`,
        `"updatedAt" = NOW()`,
      ];

      if (status === "IN_PROGRESS") {
        updateFields.push(
          `"metadataStartedAt" = COALESCE("metadataStartedAt", NOW())`
        );
      } else if (status === "COMPLETED" || status === "FAILED") {
        updateFields.push(`"metadataCompletedAt" = NOW()`);
      }

      await this.pool.query(
        `UPDATE "ScanJob" 
         SET ${updateFields.join(", ")}
         WHERE "libraryId" = $2 
         AND id = (
           SELECT id FROM "ScanJob" 
           WHERE "libraryId" = $2 
           ORDER BY "createdAt" DESC
           LIMIT 1
         )`,
        [status, libraryId]
      );
    } catch (error) {
      this.logger.debug(
        { error, libraryId, status },
        "Failed to update metadata status (non-critical)"
      );
    }
  }

  async checkAndMarkMetadataComplete(libraryId: string): Promise<boolean> {
    try {
      const result = await this.pool.query<{
        id: string;
        scannedCount: number;
        metadataSuccessCount: number;
        metadataFailedCount: number;
        metadataStatus: string;
        scanPath: string;
      }>(
        `SELECT id, "scannedCount", "metadataSuccessCount", "metadataFailedCount", 
                "metadataStatus", "scanPath"
         FROM "ScanJob"
         WHERE "libraryId" = $1 
         AND "status" IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
         AND "metadataStatus" = 'IN_PROGRESS'
         ORDER BY "createdAt" DESC
         LIMIT 1`,
        [libraryId]
      );

      if (result.rows.length === 0) {
        return false;
      }

      const job = result.rows[0];
      const totalProcessed =
        (job.metadataSuccessCount || 0) + (job.metadataFailedCount || 0);
      const totalScanned = job.scannedCount || 0;

      if (totalScanned > 0 && totalProcessed >= totalScanned) {
        await this.pool.query(
          `UPDATE "ScanJob" 
           SET "metadataStatus" = 'COMPLETED'::"MetadataJobStatus",
               "metadataCompletedAt" = NOW(),
               "updatedAt" = NOW()
           WHERE id = $1`,
          [job.id]
        );

        this.logger.info(
          {
            libraryId,
            scanJobId: job.id,
            scannedCount: totalScanned,
            totalProcessed,
          },
          "✅ Library metadata fetching completed successfully"
        );

        return true;
      }

      return false;
    } catch (error) {
      this.logger.debug(
        { error, libraryId },
        "Failed to check metadata completion (non-critical)"
      );
      return false;
    }
  }

  async incrementScanJobMetadataSuccess(libraryId: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE "ScanJob" 
         SET "metadataSuccessCount" = "metadataSuccessCount" + 1,
             "metadataStatus" = CASE 
               WHEN "metadataStatus" = 'NOT_STARTED' THEN 'IN_PROGRESS'::"MetadataJobStatus"
               ELSE "metadataStatus"
             END,
             "metadataStartedAt" = COALESCE("metadataStartedAt", NOW()),
             "updatedAt" = NOW()
         WHERE "libraryId" = $1 
         AND "status" IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
         AND id = (
           SELECT id FROM "ScanJob" 
           WHERE "libraryId" = $1 
           AND "status" IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
           ORDER BY "createdAt" DESC
           LIMIT 1
         )`,
        [libraryId]
      );
    } catch (error) {
      this.logger.debug(
        { error, libraryId },
        "Failed to increment scan job metadata success count (non-critical)"
      );
    }
  }

  async getActiveScanJobId(libraryId: string): Promise<string | null> {
    try {
      const result = await this.pool.query<{ id: string }>(
        `SELECT id FROM "ScanJob" 
         WHERE "libraryId" = $1 
         AND "status" IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
         ORDER BY "createdAt" DESC
         LIMIT 1`,
        [libraryId]
      );

      return result.rows[0]?.id || null;
    } catch (error) {
      this.logger.debug(
        { error, libraryId },
        "Failed to get active scan job ID (non-critical)"
      );
      return null;
    }
  }

  async incrementScanJobMetadataFailure(libraryId: string): Promise<void> {
    try {
      await this.pool.query(
        `UPDATE "ScanJob" 
         SET "metadataFailedCount" = "metadataFailedCount" + 1,
             "metadataStatus" = CASE 
               WHEN "metadataStatus" = 'NOT_STARTED' THEN 'IN_PROGRESS'::"MetadataJobStatus"
               ELSE "metadataStatus"
             END,
             "metadataStartedAt" = COALESCE("metadataStartedAt", NOW()),
             "updatedAt" = NOW()
         WHERE "libraryId" = $1 
         AND "status" IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
         AND id = (
           SELECT id FROM "ScanJob" 
           WHERE "libraryId" = $1 
           AND "status" IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
           ORDER BY "createdAt" DESC
           LIMIT 1
         )`,
        [libraryId]
      );
    } catch (error) {
      this.logger.debug(
        { error, libraryId },
        "Failed to increment scan job metadata failure count (non-critical)"
      );
    }
  }
}
