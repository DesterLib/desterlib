import { Pool, PoolClient } from "pg";
import { Logger } from "@dester/logger";

export interface Media {
  id: string;
  title: string;
  type: string;
  description: string | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  releaseDate: Date | null;
  rating: number | null;
}

export interface MetadataProviderConfig {
  id: string;
  name: string; // e.g., "tmdb", "omdb"
  enabled: boolean;
  priority: number; // Lower number = higher priority
  config: Record<string, any>; // Provider-specific configuration (JSON)
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

  async getMedia(id: string): Promise<Media | null> {
    const result = await this.pool.query<Media>(
      `SELECT id, title, type, description, "posterUrl", "backdropUrl", "releaseDate", rating
       FROM "Media"
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  }

  async updateMediaMetadata(
    mediaId: string,
    metadata: {
      tmdbId: number;
      title: string;
      overview: string | null;
      posterUrl: string | null;
      backdropUrl: string | null;
      releaseDate: Date | null;
      rating: number | null;
      genres: string[];
    }
  ) {
    const client: PoolClient = await this.pool.connect();

    try {
      await client.query("BEGIN");

      // Check if Media record exists first
      const mediaCheck = await client.query(
        `SELECT id FROM "Media" WHERE id = $1`,
        [mediaId]
      );

      if (mediaCheck.rows.length === 0) {
        // Media record doesn't exist - this can happen if:
        // 1. The Media was deleted after the job was queued
        // 2. The scanner created a job but the Media record was never created
        // 3. Race condition where job is processed before Media is committed
        this.logger.warn(
          { mediaId },
          "Media record not found, skipping metadata update. This may be a stale job."
        );
        await client.query("ROLLBACK");
        // Throw a specific error so the job processor can track it as a failure
        const error = new Error(`Media record not found: ${mediaId}`);
        (error as any).code = "MEDIA_NOT_FOUND";
        throw error;
      }

      // Update Media
      await client.query(
        `UPDATE "Media" SET
          title = $1,
          description = $2,
          "posterUrl" = $3,
          "backdropUrl" = $4,
          "releaseDate" = $5,
          rating = $6,
          "updatedAt" = NOW()
         WHERE id = $7`,
        [
          metadata.title,
          metadata.overview,
          metadata.posterUrl,
          metadata.backdropUrl,
          metadata.releaseDate,
          metadata.rating,
          mediaId,
        ]
      );

      // Add ExternalId (TMDB)
      // Handle conflicts on both unique constraints:
      // 1. (source, mediaId) - If this media already has an ExternalId, update it
      // 2. (source, externalId) - If this TMDB ID is already used by another media, skip it
      //
      // Strategy: First try to update if (source, mediaId) exists, otherwise insert.
      // If (source, externalId) conflict occurs, it means another media has this TMDB ID,
      // so we skip creating the ExternalId (the metadata is still saved to Media table).
      try {
        await client.query(
          `INSERT INTO "ExternalId" (id, source, "externalId", "mediaId", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, 'TMDB', $1, $2, NOW(), NOW())
           ON CONFLICT (source, "mediaId") 
           DO UPDATE SET
             "externalId" = EXCLUDED."externalId",
             "updatedAt" = NOW()`,
          [metadata.tmdbId.toString(), mediaId]
        );
      } catch (insertError: any) {
        // Handle (source, externalId) conflict - TMDB ID already belongs to another media
        if (
          insertError?.code === "23505" &&
          insertError?.constraint === "ExternalId_source_externalId_key"
        ) {
          // TMDB ID is already associated with a different media - skip ExternalId creation
          // The metadata has already been saved to the Media table, so this is acceptable
          this.logger.debug(
            {
              mediaId,
              tmdbId: metadata.tmdbId,
              constraint: "ExternalId_source_externalId_key",
            },
            "TMDB ID already exists for another media, skipping ExternalId creation"
          );
        } else if (
          insertError?.code === "23503" &&
          insertError?.constraint === "ExternalId_mediaId_fkey"
        ) {
          // Foreign key constraint - Media record was deleted between check and insert
          // This is a race condition, but we've already updated the Media table above
          // So this shouldn't happen, but handle it gracefully
          this.logger.warn(
            {
              mediaId,
              tmdbId: metadata.tmdbId,
              constraint: "ExternalId_mediaId_fkey",
            },
            "Media record was deleted during metadata update, skipping ExternalId creation"
          );
        } else {
          // Re-throw other errors
          throw insertError;
        }
      }

      // Note: Genre handling would typically go here (creating Genre records and linking via MediaGenre)
      // For now, we'll skip detailed genre implementation to match scope, or add simple text storage if needed.
      // The current scope is to replace the old table structure.

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check if media already has complete metadata
   * Returns true if media has title, description, and at least one image URL
   */
  async hasCompleteMetadata(mediaId: string): Promise<boolean> {
    try {
      const result = await this.pool.query<{
        hasMetadata: boolean;
      }>(
        `SELECT 
          CASE 
            WHEN title IS NOT NULL 
            AND description IS NOT NULL 
            AND ("posterUrl" IS NOT NULL OR "backdropUrl" IS NOT NULL)
            THEN true
            ELSE false
          END as "hasMetadata"
        FROM "Media"
        WHERE id = $1`,
        [mediaId]
      );

      return result.rows[0]?.hasMetadata || false;
    } catch (error) {
      this.logger.warn(
        { error, mediaId },
        "Failed to check if media has complete metadata"
      );
      return false; // If check fails, assume metadata is missing (safer to fetch)
    }
  }

  /**
   * Get existing metadata for media (to check if we should skip fetching)
   */
  async getMediaMetadata(mediaId: string): Promise<{
    posterUrl: string | null;
    backdropUrl: string | null;
    hasExternalId: boolean;
    mediaType: string | null;
  } | null> {
    try {
      const result = await this.pool.query<{
        posterUrl: string | null;
        backdropUrl: string | null;
        hasExternalId: boolean;
        mediaType: string | null;
      }>(
        `SELECT 
          m."posterUrl",
          m."backdropUrl",
          m.type as "mediaType",
          CASE WHEN e.id IS NOT NULL THEN true ELSE false END as "hasExternalId"
        FROM "Media" m
        LEFT JOIN "ExternalId" e ON e."mediaId" = m.id AND e.source = 'TMDB'
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

  /**
   * Get media type from database
   */
  async getMediaType(mediaId: string): Promise<string | null> {
    try {
      const result = await this.pool.query<{ type: string }>(
        `SELECT type FROM "Media" WHERE id = $1`,
        [mediaId]
      );

      return result.rows[0]?.type || null;
    } catch (error) {
      this.logger.warn({ error, mediaId }, "Failed to get media type");
      return null;
    }
  }

  /**
   * Update metadata status for scan job
   */
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

  /**
   * Check if all metadata jobs are complete and update status if needed
   * Returns true if completion was detected, false otherwise
   *
   * Note: scannedCount now only counts valid media files that were successfully saved,
   * so it accurately represents the number of files that should get metadata jobs.
   */
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

      // Check if all jobs are complete
      // scannedCount now only counts valid media files that were successfully saved,
      // so it accurately represents files that should get metadata jobs
      if (totalScanned > 0 && totalProcessed >= totalScanned) {
        // Mark as completed
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
            scanPath: job.scanPath,
            scannedCount: totalScanned,
            metadataSuccessCount: job.metadataSuccessCount,
            metadataFailedCount: job.metadataFailedCount,
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

  /**
   * Increment metadata success count for active scan job
   * Also updates COMPLETED jobs since metadata processing happens asynchronously
   * Automatically marks as COMPLETED when all jobs are finished
   */
  async incrementScanJobMetadataSuccess(libraryId: string): Promise<void> {
    try {
      // First, increment the success count
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

      // Completion check is done separately after logging in index.ts
    } catch (error) {
      this.logger.debug(
        { error, libraryId },
        "Failed to increment scan job metadata success count (non-critical)"
      );
    }
  }

  /**
   * Get the active scan job ID for a library
   * Returns the most recent scan job that is PENDING, IN_PROGRESS, or COMPLETED
   */
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

  /**
   * Increment metadata failure count for active scan job
   * Automatically marks as COMPLETED when all jobs are finished
   */
  async incrementScanJobMetadataFailure(libraryId: string): Promise<void> {
    try {
      // First, increment the failure count
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

      // Completion check is done separately after logging in index.ts
    } catch (error) {
      this.logger.debug(
        { error, libraryId },
        "Failed to increment scan job metadata failure count (non-critical)"
      );
    }
  }
}
