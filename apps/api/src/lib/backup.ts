/**
 * Database Backup Service
 *
 * Provides automated backup functionality for the SQLite database:
 * - Scheduled automatic backups
 * - On-demand backup creation
 * - Backup rotation (keep last N backups)
 * - Backup restoration
 * - Backup verification
 *
 * Backup Strategy:
 * - Daily automatic backups at 2 AM
 * - Keep last 7 daily backups
 * - Keep last 4 weekly backups (Sundays)
 * - Keep last 12 monthly backups (1st of month)
 * - Store backups in compressed format (.gz)
 */

import { promises as fs, createReadStream, createWriteStream } from "fs";
import { join } from "path";
import { createGzip, createGunzip } from "zlib";
import { pipeline } from "stream/promises";
import { env } from "../config/env.js";
import logger from "../config/logger.js";
import { prisma } from "./prisma.js";

// Backup configuration
const BACKUP_DIR = process.env.BACKUP_DIR || join(process.cwd(), "backups");
const MAX_DAILY_BACKUPS = 7;
const MAX_WEEKLY_BACKUPS = 4;
const MAX_MONTHLY_BACKUPS = 12;

// Backup schedule (cron-like)
const BACKUP_HOUR = 2; // 2 AM
const BACKUP_MINUTE = 0;

export interface BackupMetadata {
  filename: string;
  filepath: string;
  size: number;
  created: Date;
  type: "daily" | "weekly" | "monthly" | "manual";
  compressed: boolean;
  verified: boolean;
}

export interface BackupResult {
  success: boolean;
  backup?: BackupMetadata;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  restoredFrom: string;
  error?: string;
}

/**
 * Ensure backup directory exists
 */
async function ensureBackupDir(): Promise<void> {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    logger.info(`Backup directory ensured: ${BACKUP_DIR}`);
  } catch (error) {
    logger.error("Failed to create backup directory:", error);
    throw error;
  }
}

/**
 * Get the database file path from DATABASE_URL
 */
function getDatabasePath(): string {
  const dbUrl = env.DATABASE_URL;

  if (dbUrl.startsWith("file:")) {
    // Extract path from file:./path/to/db
    const filePath = dbUrl.replace(/^file:/, "");
    return join(process.cwd(), "apps/api/prisma", filePath);
  }

  throw new Error("Only SQLite databases are supported for backup");
}

/**
 * Generate backup filename with timestamp
 */
function generateBackupFilename(
  type: BackupMetadata["type"] = "manual"
): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, "-");
  return `backup-${type}-${timestamp}.db.gz`;
}

/**
 * Determine backup type based on current date
 */
function getBackupType(): "daily" | "weekly" | "monthly" {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const dayOfMonth = now.getDate();

  if (dayOfMonth === 1) {
    return "monthly";
  } else if (dayOfWeek === 0) {
    return "weekly";
  } else {
    return "daily";
  }
}

/**
 * Create a compressed backup of the database
 */
export async function createBackup(
  type: BackupMetadata["type"] = "manual"
): Promise<BackupResult> {
  try {
    await ensureBackupDir();

    const dbPath = getDatabasePath();
    const filename = generateBackupFilename(type);
    const backupPath = join(BACKUP_DIR, filename);

    logger.info(`Creating ${type} backup: ${filename}`);

    // Ensure database is in a consistent state
    await prisma.$executeRaw`PRAGMA wal_checkpoint(TRUNCATE)`;

    // Copy database file with compression
    const source = createReadStream(dbPath);
    const destination = createWriteStream(backupPath);
    const gzip = createGzip({ level: 9 }); // Maximum compression

    await pipeline(source, gzip, destination);

    // Get file stats
    const stats = await fs.stat(backupPath);

    // Verify backup
    const isValid = await verifyBackup(backupPath);

    const metadata: BackupMetadata = {
      filename,
      filepath: backupPath,
      size: stats.size,
      created: new Date(),
      type,
      compressed: true,
      verified: isValid,
    };

    logger.info(
      `Backup created successfully: ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`
    );

    // Rotate old backups
    await rotateBackups();

    return {
      success: true,
      backup: metadata,
    };
  } catch (error) {
    logger.error("Failed to create backup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * List all available backups
 */
export async function listBackups(): Promise<BackupMetadata[]> {
  try {
    await ensureBackupDir();

    const files = await fs.readdir(BACKUP_DIR);
    const backups: BackupMetadata[] = [];

    for (const file of files) {
      if (file.endsWith(".db.gz") || file.endsWith(".db")) {
        const filepath = join(BACKUP_DIR, file);
        const stats = await fs.stat(filepath);

        // Parse type from filename
        let type: BackupMetadata["type"] = "manual";
        if (file.includes("-daily-")) type = "daily";
        else if (file.includes("-weekly-")) type = "weekly";
        else if (file.includes("-monthly-")) type = "monthly";

        backups.push({
          filename: file,
          filepath,
          size: stats.size,
          created: stats.mtime,
          type,
          compressed: file.endsWith(".gz"),
          verified: false, // Not verified yet
        });
      }
    }

    // Sort by creation date (newest first)
    return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
  } catch (error) {
    logger.error("Failed to list backups:", error);
    return [];
  }
}

/**
 * Verify backup integrity
 */
async function verifyBackup(backupPath: string): Promise<boolean> {
  try {
    // For compressed backups, try to decompress a small portion
    if (backupPath.endsWith(".gz")) {
      const source = createReadStream(backupPath, { end: 1024 }); // Read first 1KB
      const gunzip = createGunzip();

      return new Promise((resolve) => {
        source.pipe(gunzip);

        gunzip.on("data", () => {
          source.destroy();
          gunzip.destroy();
          resolve(true);
        });

        gunzip.on("error", () => {
          resolve(false);
        });
      });
    }

    // For uncompressed backups, check if file is readable
    await fs.access(backupPath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Restore database from backup
 */
export async function restoreBackup(
  backupFilename: string
): Promise<RestoreResult> {
  try {
    const backupPath = join(BACKUP_DIR, backupFilename);

    // Verify backup exists
    try {
      await fs.access(backupPath, fs.constants.R_OK);
    } catch {
      throw new Error(`Backup file not found: ${backupFilename}`);
    }

    // Verify backup integrity
    const isValid = await verifyBackup(backupPath);
    if (!isValid) {
      throw new Error("Backup file is corrupted or invalid");
    }

    const dbPath = getDatabasePath();

    logger.warn(`Restoring database from backup: ${backupFilename}`);
    logger.warn("This will overwrite the current database!");

    // Create a safety backup of current database
    const safetyBackup = await createBackup("manual");
    if (!safetyBackup.success) {
      throw new Error("Failed to create safety backup before restore");
    }

    // Disconnect Prisma to release database locks
    await prisma.$disconnect();

    try {
      // Decompress and restore
      if (backupPath.endsWith(".gz")) {
        const source = createReadStream(backupPath);
        const destination = createWriteStream(dbPath);
        const gunzip = createGunzip();

        await pipeline(source, gunzip, destination);
      } else {
        // Direct copy for uncompressed backups
        await fs.copyFile(backupPath, dbPath);
      }

      logger.info(`Database restored successfully from: ${backupFilename}`);

      return {
        success: true,
        restoredFrom: backupFilename,
      };
    } finally {
      // Reconnect Prisma
      await prisma.$connect();
    }
  } catch (error) {
    logger.error("Failed to restore backup:", error);
    return {
      success: false,
      restoredFrom: backupFilename,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Rotate old backups based on retention policy
 */
async function rotateBackups(): Promise<void> {
  try {
    const backups = await listBackups();

    // Group backups by type
    const daily = backups.filter((b) => b.type === "daily");
    const weekly = backups.filter((b) => b.type === "weekly");
    const monthly = backups.filter((b) => b.type === "monthly");

    // Delete old daily backups
    if (daily.length > MAX_DAILY_BACKUPS) {
      const toDelete = daily.slice(MAX_DAILY_BACKUPS);
      for (const backup of toDelete) {
        await fs.unlink(backup.filepath);
        logger.info(`Deleted old daily backup: ${backup.filename}`);
      }
    }

    // Delete old weekly backups
    if (weekly.length > MAX_WEEKLY_BACKUPS) {
      const toDelete = weekly.slice(MAX_WEEKLY_BACKUPS);
      for (const backup of toDelete) {
        await fs.unlink(backup.filepath);
        logger.info(`Deleted old weekly backup: ${backup.filename}`);
      }
    }

    // Delete old monthly backups
    if (monthly.length > MAX_MONTHLY_BACKUPS) {
      const toDelete = monthly.slice(MAX_MONTHLY_BACKUPS);
      for (const backup of toDelete) {
        await fs.unlink(backup.filepath);
        logger.info(`Deleted old monthly backup: ${backup.filename}`);
      }
    }
  } catch (error) {
    logger.error("Failed to rotate backups:", error);
  }
}

/**
 * Schedule automatic backups
 */
export function scheduleBackups(): void {
  // Calculate milliseconds until next backup time
  function getNextBackupTime(): number {
    const now = new Date();
    const next = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      BACKUP_HOUR,
      BACKUP_MINUTE,
      0,
      0
    );

    // If time has passed today, schedule for tomorrow
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }

    return next.getTime() - now.getTime();
  }

  // Schedule next backup
  function scheduleNext(): void {
    const delay = getNextBackupTime();
    logger.info(
      `Next automatic backup scheduled in ${(delay / 1000 / 60 / 60).toFixed(1)} hours`
    );

    setTimeout(async () => {
      const type = getBackupType();
      logger.info(`Starting automatic ${type} backup...`);

      const result = await createBackup(type);

      if (result.success) {
        logger.info(`Automatic ${type} backup completed successfully`);
      } else {
        logger.error(`Automatic ${type} backup failed:`, result.error);
      }

      // Schedule next backup
      scheduleNext();
    }, delay);
  }

  // Only schedule in production
  if (env.NODE_ENV === "production") {
    scheduleNext();
    logger.info("Automatic backup scheduling enabled");
  } else {
    logger.info("Automatic backup scheduling disabled (not in production)");
  }
}

/**
 * Get backup statistics
 */
export async function getBackupStats(): Promise<{
  totalBackups: number;
  totalSize: number;
  oldestBackup: Date | null;
  newestBackup: Date | null;
  byType: Record<BackupMetadata["type"], number>;
}> {
  const backups = await listBackups();

  const stats = {
    totalBackups: backups.length,
    totalSize: backups.reduce((sum, b) => sum + b.size, 0),
    oldestBackup:
      backups.length > 0 && backups[backups.length - 1]
        ? backups[backups.length - 1]!.created
        : null,
    newestBackup: backups.length > 0 && backups[0] ? backups[0]!.created : null,
    byType: {
      daily: backups.filter((b) => b.type === "daily").length,
      weekly: backups.filter((b) => b.type === "weekly").length,
      monthly: backups.filter((b) => b.type === "monthly").length,
      manual: backups.filter((b) => b.type === "manual").length,
    },
  };

  return stats;
}

/**
 * Delete a specific backup
 */
export async function deleteBackup(filename: string): Promise<boolean> {
  try {
    const filepath = join(BACKUP_DIR, filename);
    await fs.unlink(filepath);
    logger.info(`Deleted backup: ${filename}`);
    return true;
  } catch (error) {
    logger.error(`Failed to delete backup ${filename}:`, error);
    return false;
  }
}
