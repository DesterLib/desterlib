-- CreateEnum
CREATE TYPE "ScanJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PAUSED');

-- CreateTable
CREATE TABLE "ScanJob" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "scanPath" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "status" "ScanJobStatus" NOT NULL DEFAULT 'PENDING',
    "batchSize" INTEGER NOT NULL,
    "totalFolders" INTEGER NOT NULL DEFAULT 0,
    "processedCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "processedFolders" TEXT NOT NULL DEFAULT '[]',
    "failedFolders" TEXT NOT NULL DEFAULT '[]',
    "pendingFolders" TEXT NOT NULL DEFAULT '[]',
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastBatchAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScanJob_libraryId_idx" ON "ScanJob"("libraryId");

-- CreateIndex
CREATE INDEX "ScanJob_status_idx" ON "ScanJob"("status");

-- CreateIndex
CREATE INDEX "ScanJob_scanPath_idx" ON "ScanJob"("scanPath");

-- AddForeignKey
ALTER TABLE "ScanJob" ADD CONSTRAINT "ScanJob_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;
