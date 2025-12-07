/**
 * Scan Job Service
 * Handles creating scan job database records
 */

import type { ScanJobRepository } from "../../infrastructure/repositories/scan/scan-job.repository";
import type { MediaType } from "@prisma/client";

export class ScanJobService {
  constructor(private readonly scanJobRepository: ScanJobRepository) {}

  /**
   * Create a new scan job
   * @param libraryId - The library ID
   * @param scanPath - The path being scanned
   * @param mediaType - The media type
   * @returns Promise resolving to the created scan job entity
   */
  async create(libraryId: string, scanPath: string, mediaType: MediaType) {
    return await this.scanJobRepository.create({
      libraryId,
      scanPath,
      mediaType,
    });
  }
}
