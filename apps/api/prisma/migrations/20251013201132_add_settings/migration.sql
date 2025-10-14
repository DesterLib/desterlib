-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "isSetupComplete" BOOLEAN NOT NULL DEFAULT false,
    "movieLibraryPath" TEXT,
    "tvShowLibraryPath" TEXT,
    "musicLibraryPath" TEXT,
    "comicLibraryPath" TEXT,
    "tmdbApiKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
