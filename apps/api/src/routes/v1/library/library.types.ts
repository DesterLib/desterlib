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
