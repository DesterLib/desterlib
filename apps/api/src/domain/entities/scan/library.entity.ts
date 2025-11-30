/**
 * Library Domain Entity
 * Pure domain model - no infrastructure dependencies
 */

export interface Library {
  id: string;
  name: string;
  slug: string;
  libraryPath: string;
  libraryType: "MOVIE" | "TV_SHOW";
  isLibrary: boolean;
  createdAt: Date;
  updatedAt: Date;
}
