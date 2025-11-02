import { Library, Prisma } from "@prisma/client";

/**
 * Library types and interfaces
 */

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

// Extended library type with media count
export interface LibraryWithMetadata
  extends Omit<Library, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
  mediaCount: number;
}

// Prisma payload types for type-safe queries
export type LibraryWithMediaRelations = Prisma.LibraryGetPayload<{
  include: {
    media: {
      include: {
        media: {
          include: {
            libraries: true;
          };
        };
      };
    };
  };
}>;

// Type for media library with nested relations
export type MediaLibraryWithRelations =
  LibraryWithMediaRelations["media"][number];

// Type for Prisma transaction client
export type PrismaTransactionClient = Prisma.TransactionClient;
