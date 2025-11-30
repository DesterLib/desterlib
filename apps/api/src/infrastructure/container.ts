/**
 * Dependency Injection Container
 * Simple container for wiring dependencies
 */

import { config } from "../config/env";
import { ScannerServiceRepository } from "./repositories/scan/scanner-service.repository.impl";
import { ScanJobRepository } from "./repositories/scan/scan-job.repository.impl";
import { OffloadScanUseCase } from "../app/scan/offload-scan.use-case";
import { GetScanStatusUseCase } from "../app/scan/get-scan-status.use-case";
import { CreateScanJobUseCase } from "../app/scan/create-scan-job.use-case";
import { ResumeScanUseCase } from "../app/scan/resume-scan.use-case";
import type { IScannerServiceRepository } from "../domain/repositories/scan/scanner-service.repository.interface";
import type { IScanJobRepository } from "../domain/repositories/scan/scan-job.repository.interface";

class Container {
  private scannerServiceRepo: IScannerServiceRepository | null = null;
  private scanJobRepo: IScanJobRepository | null = null;
  private offloadScanUseCase: OffloadScanUseCase | null = null;
  private getScanStatusUseCase: GetScanStatusUseCase | null = null;
  private createScanJobUseCase: CreateScanJobUseCase | null = null;
  private resumeScanUseCase: ResumeScanUseCase | null = null;

  /**
   * Initialize repositories
   */
  initialize() {
    this.scannerServiceRepo = new ScannerServiceRepository({
      scannerServiceUrl: config.scannerServiceUrl,
      timeout: 30000,
    });
    this.scanJobRepo = new ScanJobRepository();
  }

  /**
   * Get scan job repository
   */
  getScanJobRepository(): IScanJobRepository {
    if (!this.scanJobRepo) {
      this.initialize();
    }
    if (!this.scanJobRepo) {
      throw new Error("Failed to initialize scan job repository");
    }
    return this.scanJobRepo;
  }

  /**
   * Get scanner service repository
   */
  getScannerServiceRepository(): IScannerServiceRepository {
    if (!this.scannerServiceRepo) {
      this.initialize();
    }
    if (!this.scannerServiceRepo) {
      throw new Error("Failed to initialize scanner service repository");
    }
    return this.scannerServiceRepo;
  }

  /**
   * Get offload scan use case
   */
  getOffloadScanUseCase(): OffloadScanUseCase {
    if (this.offloadScanUseCase) {
      return this.offloadScanUseCase;
    }

    const repo = this.getScannerServiceRepository();
    this.offloadScanUseCase = new OffloadScanUseCase(repo);

    return this.offloadScanUseCase;
  }

  /**
   * Get scan status use case
   */
  getGetScanStatusUseCase(): GetScanStatusUseCase {
    if (this.getScanStatusUseCase) {
      return this.getScanStatusUseCase;
    }

    const scanJobRepo = this.getScanJobRepository();
    this.getScanStatusUseCase = new GetScanStatusUseCase(scanJobRepo);

    return this.getScanStatusUseCase;
  }

  /**
   * Get create scan job use case
   */
  getCreateScanJobUseCase(): CreateScanJobUseCase {
    if (this.createScanJobUseCase) {
      return this.createScanJobUseCase;
    }

    const repo = this.getScanJobRepository();
    this.createScanJobUseCase = new CreateScanJobUseCase(repo);

    return this.createScanJobUseCase;
  }

  /**
   * Get resume scan use case
   */
  getResumeScanUseCase(): ResumeScanUseCase {
    if (this.resumeScanUseCase) {
      return this.resumeScanUseCase;
    }

    const scanJobRepo = this.getScanJobRepository();
    this.resumeScanUseCase = new ResumeScanUseCase(scanJobRepo);

    return this.resumeScanUseCase;
  }
}

// Export singleton instance
export const container = new Container();
