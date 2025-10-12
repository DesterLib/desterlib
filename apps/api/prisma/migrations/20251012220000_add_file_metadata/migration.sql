-- AlterTable
ALTER TABLE "Movie" ADD COLUMN "filePath" TEXT;
ALTER TABLE "Movie" ADD COLUMN "fileSize" BIGINT;
ALTER TABLE "Movie" ADD COLUMN "fileModifiedAt" DATETIME;

-- AlterTable
ALTER TABLE "Episode" ADD COLUMN "fileSize" BIGINT;
ALTER TABLE "Episode" ADD COLUMN "fileModifiedAt" DATETIME;

-- AlterTable
ALTER TABLE "Music" ADD COLUMN "fileSize" BIGINT;
ALTER TABLE "Music" ADD COLUMN "fileModifiedAt" DATETIME;

-- AlterTable
ALTER TABLE "Comic" ADD COLUMN "fileSize" BIGINT;
ALTER TABLE "Comic" ADD COLUMN "fileModifiedAt" DATETIME;

-- CreateIndex
CREATE UNIQUE INDEX "Movie_filePath_key" ON "Movie"("filePath");

-- CreateIndex
CREATE INDEX "Movie_filePath_idx" ON "Movie"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_filePath_key" ON "Episode"("filePath");

-- CreateIndex
CREATE INDEX "Episode_filePath_idx" ON "Episode"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "Music_filePath_key" ON "Music"("filePath");

-- CreateIndex
CREATE INDEX "Music_filePath_idx" ON "Music"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "Comic_filePath_key" ON "Comic"("filePath");

-- CreateIndex
CREATE INDEX "Comic_filePath_idx" ON "Comic"("filePath");

