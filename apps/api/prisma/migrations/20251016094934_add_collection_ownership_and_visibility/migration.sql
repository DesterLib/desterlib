-- CreateEnum
CREATE TYPE "CollectionVisibility" AS ENUM ('PRIVATE', 'EVERYONE', 'SELECTED_USERS');

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "visibility" "CollectionVisibility" NOT NULL DEFAULT 'EVERYONE';

-- CreateTable
CREATE TABLE "CollectionAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedById" TEXT,

    CONSTRAINT "CollectionAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CollectionAccess_userId_idx" ON "CollectionAccess"("userId");

-- CreateIndex
CREATE INDEX "CollectionAccess_collectionId_idx" ON "CollectionAccess"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "CollectionAccess_userId_collectionId_key" ON "CollectionAccess"("userId", "collectionId");

-- CreateIndex
CREATE INDEX "Collection_createdById_idx" ON "Collection"("createdById");

-- CreateIndex
CREATE INDEX "Collection_visibility_idx" ON "Collection"("visibility");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionAccess" ADD CONSTRAINT "CollectionAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionAccess" ADD CONSTRAINT "CollectionAccess_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
