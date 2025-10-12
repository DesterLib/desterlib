/*
  Warnings:

  - You are about to drop the column `fileUrl` on the `Comic` table. All the data in the column will be lost.
  - You are about to drop the column `videoUrl` on the `Episode` table. All the data in the column will be lost.
  - You are about to drop the column `trackUrl` on the `Music` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Comic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issue" INTEGER,
    "volume" TEXT,
    "publisher" TEXT,
    "pages" INTEGER,
    "filePath" TEXT,
    "fileSize" BIGINT,
    "fileModifiedAt" DATETIME,
    "mediaId" TEXT NOT NULL,
    CONSTRAINT "Comic_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Comic" ("fileModifiedAt", "fileSize", "id", "issue", "mediaId", "pages", "publisher", "volume") SELECT "fileModifiedAt", "fileSize", "id", "issue", "mediaId", "pages", "publisher", "volume" FROM "Comic";
DROP TABLE "Comic";
ALTER TABLE "new_Comic" RENAME TO "Comic";
CREATE UNIQUE INDEX "Comic_filePath_key" ON "Comic"("filePath");
CREATE UNIQUE INDEX "Comic_mediaId_key" ON "Comic"("mediaId");
CREATE INDEX "Comic_publisher_idx" ON "Comic"("publisher");
CREATE INDEX "Comic_filePath_idx" ON "Comic"("filePath");
CREATE TABLE "new_Episode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "duration" INTEGER,
    "airDate" DATETIME,
    "filePath" TEXT,
    "fileSize" BIGINT,
    "fileModifiedAt" DATETIME,
    "seasonId" TEXT NOT NULL,
    CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Episode" ("airDate", "duration", "fileModifiedAt", "fileSize", "id", "number", "seasonId", "title") SELECT "airDate", "duration", "fileModifiedAt", "fileSize", "id", "number", "seasonId", "title" FROM "Episode";
DROP TABLE "Episode";
ALTER TABLE "new_Episode" RENAME TO "Episode";
CREATE UNIQUE INDEX "Episode_filePath_key" ON "Episode"("filePath");
CREATE INDEX "Episode_seasonId_idx" ON "Episode"("seasonId");
CREATE INDEX "Episode_filePath_idx" ON "Episode"("filePath");
CREATE UNIQUE INDEX "Episode_seasonId_number_key" ON "Episode"("seasonId", "number");
CREATE TABLE "new_Music" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "genre" TEXT,
    "duration" INTEGER,
    "filePath" TEXT,
    "fileSize" BIGINT,
    "fileModifiedAt" DATETIME,
    "mediaId" TEXT NOT NULL,
    CONSTRAINT "Music_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Music" ("album", "artist", "duration", "fileModifiedAt", "fileSize", "genre", "id", "mediaId") SELECT "album", "artist", "duration", "fileModifiedAt", "fileSize", "genre", "id", "mediaId" FROM "Music";
DROP TABLE "Music";
ALTER TABLE "new_Music" RENAME TO "Music";
CREATE UNIQUE INDEX "Music_filePath_key" ON "Music"("filePath");
CREATE UNIQUE INDEX "Music_mediaId_key" ON "Music"("mediaId");
CREATE INDEX "Music_artist_idx" ON "Music"("artist");
CREATE INDEX "Music_genre_idx" ON "Music"("genre");
CREATE INDEX "Music_filePath_idx" ON "Music"("filePath");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
