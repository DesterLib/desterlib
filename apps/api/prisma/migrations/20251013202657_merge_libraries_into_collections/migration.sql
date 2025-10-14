/*
  Warnings:

  - You are about to drop the `LibraryPath` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "LibraryPath_settingsId_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "LibraryPath";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "isLibrary" BOOLEAN NOT NULL DEFAULT false,
    "libraryPath" TEXT,
    "libraryType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "parentId" TEXT,
    "settingsId" TEXT,
    CONSTRAINT "Collection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Collection_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "Settings" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Collection" ("backdropUrl", "createdAt", "description", "id", "name", "parentId", "posterUrl", "slug", "updatedAt") SELECT "backdropUrl", "createdAt", "description", "id", "name", "parentId", "posterUrl", "slug", "updatedAt" FROM "Collection";
DROP TABLE "Collection";
ALTER TABLE "new_Collection" RENAME TO "Collection";
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");
CREATE INDEX "Collection_slug_idx" ON "Collection"("slug");
CREATE INDEX "Collection_parentId_idx" ON "Collection"("parentId");
CREATE INDEX "Collection_isLibrary_idx" ON "Collection"("isLibrary");
CREATE INDEX "Collection_settingsId_idx" ON "Collection"("settingsId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
