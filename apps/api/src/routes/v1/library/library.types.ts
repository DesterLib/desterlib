import { Library } from "../../../../generated/prisma";

/**
 * Library types and interfaces
 */

export interface LibraryDeleteResult {
  success: boolean;
  libraryId: string;
  libraryName: string;
  mediaDeleted: number;
  message: string;
}

export interface LibraryUpdateResult {
  success: boolean;
  library: Library;
  message: string;
}

// Extended library type with media count
export interface LibraryWithMetadata
  extends Omit<Library, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
  mediaCount: number;
}
