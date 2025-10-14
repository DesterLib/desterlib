/*
  Warnings:

  - You are about to drop the column `comicLibraryPath` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `movieLibraryPath` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `musicLibraryPath` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `tvShowLibraryPath` on the `Settings` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "LibraryPath" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "settingsId" TEXT NOT NULL DEFAULT 'default',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LibraryPath_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "Settings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "isSetupComplete" BOOLEAN NOT NULL DEFAULT false,
    "tmdbApiKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("createdAt", "id", "isSetupComplete", "tmdbApiKey", "updatedAt") SELECT "createdAt", "id", "isSetupComplete", "tmdbApiKey", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "LibraryPath_settingsId_idx" ON "LibraryPath"("settingsId");
