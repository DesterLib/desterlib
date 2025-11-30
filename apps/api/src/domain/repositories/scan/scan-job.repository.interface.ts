/**
 * Scan Job Repository Interface
 * Abstraction for managing ScanJob database records
 */

import type { ScanJobStatus, MediaType } from "@prisma/client";

// MetadataJobStatus will be available after running: pnpm db:generate
// Using string literal type for now
type MetadataJobStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "FAILED";

export interface ScanJobEntity {
  id: string;
  libraryId: string;
  scanPath: string;
  mediaType: MediaType;
  status: ScanJobStatus;
  metadataStatus: MetadataJobStatus;
  scannedCount: number;
  metadataSuccessCount: number;
  metadataFailedCount: number;
  startedAt: Date | null;
  completedAt: Date | null;
  metadataStartedAt: Date | null;
  metadataCompletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScanJobInput {
  libraryId: string;
  scanPath: string;
  mediaType: MediaType;
}

export interface UpdateScanJobInput {
  status?: ScanJobStatus;
  scannedCount?: number;
  metadataSuccessCount?: number;
  metadataFailedCount?: number;
  startedAt?: Date | null;
  completedAt?: Date | null;
}

export interface IScanJobRepository {
  /**
   * Create a new scan job record
   */
  create(input: CreateScanJobInput): Promise<ScanJobEntity>;

  /**
   * Find a scan job by ID
   */
  findById(id: string): Promise<ScanJobEntity | null>;

  /**
   * Find scan jobs by library ID
   */
  findByLibraryId(libraryId: string): Promise<ScanJobEntity[]>;

  /**
   * Find scan jobs by status
   */
  findByStatus(status: ScanJobStatus): Promise<ScanJobEntity[]>;

  /**
   * Update a scan job
   */
  update(id: string, updates: UpdateScanJobInput): Promise<ScanJobEntity>;

  /**
   * Delete a scan job
   */
  delete(id: string): Promise<void>;

  /**
   * Delete multiple scan jobs matching criteria
   */
  deleteMany(criteria: {
    status?: ScanJobStatus[];
    completedBefore?: Date;
  }): Promise<number>;

  /**
   * Find all scan jobs with pagination
   */
  findAll(options?: {
    status?: ScanJobStatus;
    libraryId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ jobs: ScanJobEntity[]; total: number }>;
}
