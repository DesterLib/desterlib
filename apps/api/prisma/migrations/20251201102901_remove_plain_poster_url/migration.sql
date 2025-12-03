/*
  Warnings:

  - You are about to drop the column `plainPosterUrl` on the `Movie` table. All the data in the column will be lost.
  - You are about to drop the column `plainPosterUrl` on the `TVShow` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Movie" DROP COLUMN "plainPosterUrl";

-- AlterTable
ALTER TABLE "TVShow" DROP COLUMN "plainPosterUrl";
