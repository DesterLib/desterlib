/**
 * Library Domain Entity
 * Pure domain model - no infrastructure dependencies
 */

export interface Library {
  id: string;
  name: string;
  slug: string;
  libraryPath: string | null;
  libraryType: "MOVIE" | "TV_SHOW" | "MUSIC" | "COMIC" | null;
  isLibrary: boolean;
  createdAt: Date;
  updatedAt: Date;
  description?: string | null;
  posterUrl?: string | null;
  backdropUrl?: string | null;
  parentId?: string | null;
}

export interface LibraryWithMetadata extends Library {
  mediaCount: number;
}

export interface LibraryDeleteResult {
  libraryId: string;
  libraryName: string;
  mediaDeleted: number;
  message: string;
}

export interface LibraryUpdateResult {
  library: Library;
  message: string;
}
