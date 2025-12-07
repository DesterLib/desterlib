/**
 * Scan Services
 * Exports scan-related services with dependencies injected
 */

import { ScanJobRepository } from "../../infrastructure/repositories/scan/scan-job.repository";
import { ScannerServiceRepository } from "../../infrastructure/repositories/scan/scanner-service.repository";
import { config } from "../../config/env";
import { ScanJobService } from "./scan-job.service";
import { ScanStatusService } from "./scan-status.service";
import { ScanResumeService } from "./scan-resume.service";
import { ScanOffloadService } from "./scan-offload.service";

// Initialize repositories
const scanJobRepository = new ScanJobRepository();
const scannerServiceRepository = new ScannerServiceRepository({
  scannerServiceUrl: config.scannerServiceUrl,
  timeout: 30000,
});

// Export service instances
export const scanJobService = new ScanJobService(scanJobRepository);
export const scanStatusService = new ScanStatusService(scanJobRepository);
export const scanResumeService = new ScanResumeService(scanJobRepository);
export const scanOffloadService = new ScanOffloadService(
  scannerServiceRepository
);

// Export service classes for testing
export { ScanJobService } from "./scan-job.service";
export {
  ScanStatusService,
  calculateScanJobProgress,
} from "./scan-status.service";
export { ScanResumeService } from "./scan-resume.service";
export { ScanOffloadService } from "./scan-offload.service";
