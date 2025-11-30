/**
 * Scan Job Entity
 * Domain entity representing a scan job from the Go scanner service
 */

export interface ScanJob {
  jobId: string;
  totalFiles: number;
  message: string;
}

export interface ScanJobStatus {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  metadataStatus:
    | "not_started"
    | "pending"
    | "processing"
    | "completed"
    | "failed";
  totalFiles?: number;
  progress?: number; // Progress percentage (0-100)
  message?: string;
  error?: string;
  metadataSuccessCount?: number;
  metadataFailedCount?: number;
}
