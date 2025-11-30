/**
 * Create Scan Job Use Case
 * Business logic for creating a scan job database record
 */

import type { IScanJobRepository } from "../../domain/repositories/scan/scan-job.repository.interface";
import type { MediaType } from "@prisma/client";

export class CreateScanJobUseCase {
  constructor(private readonly scanJobRepository: IScanJobRepository) {}

  /**
   * Execute the create scan job use case
   * @param libraryId - The library ID
   * @param scanPath - The path being scanned
   * @param mediaType - The media type
   * @returns Promise resolving to the created scan job entity
   */
  async execute(libraryId: string, scanPath: string, mediaType: MediaType) {
    return await this.scanJobRepository.create({
      libraryId,
      scanPath,
      mediaType,
    });
  }
}
