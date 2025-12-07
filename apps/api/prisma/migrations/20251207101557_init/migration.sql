-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'TV_SHOW', 'MUSIC', 'COMIC');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ACTOR', 'DIRECTOR', 'WRITER', 'PRODUCER', 'ARTIST', 'COMPOSER', 'AUTHOR', 'CREATOR', 'GUEST_STAR');

-- CreateEnum
CREATE TYPE "ScanJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PAUSED');

-- CreateEnum
CREATE TYPE "MetadataJobStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'NOT_STARTED');

-- CreateEnum
CREATE TYPE "SettingCategory" AS ENUM ('CORE', 'INTEGRATION', 'LIBRARY', 'TRANSCODING', 'NETWORK', 'NOTIFICATION', 'UI', 'PLUGIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SettingType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'SECRET');

-- CreateTable
CREATE TABLE "MediaItem" (
    "id" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" BIGINT,
    "fileModifiedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "container" TEXT,
    "videoCodec" TEXT,
    "audioCodec" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "movieId" TEXT,
    "episodeId" TEXT,
    "musicId" TEXT,
    "comicId" TEXT,

    CONSTRAINT "MediaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "overview" TEXT,
    "tagline" TEXT,
    "posterUrl" TEXT,
    "nullPosterUrl" TEXT,
    "backdropUrl" TEXT,
    "nullBackdropUrl" TEXT,
    "logoUrl" TEXT,
    "releaseDate" TIMESTAMP(3),
    "rating" DOUBLE PRECISION,
    "contentRating" TEXT,
    "trailerUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TVShow" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalTitle" TEXT,
    "overview" TEXT,
    "posterUrl" TEXT,
    "nullPosterUrl" TEXT,
    "backdropUrl" TEXT,
    "nullBackdropUrl" TEXT,
    "logoUrl" TEXT,
    "firstAirDate" TIMESTAMP(3),
    "rating" DOUBLE PRECISION,
    "contentRating" TEXT,
    "status" TEXT,
    "network" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TVShow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT,
    "overview" TEXT,
    "posterUrl" TEXT,
    "airDate" TIMESTAMP(3),
    "tvShowId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "number" INTEGER NOT NULL,
    "seasonNumber" INTEGER,
    "airDate" TIMESTAMP(3),
    "stillUrl" TEXT,
    "seasonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Music" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "albumArtist" TEXT,
    "genre" TEXT,
    "year" INTEGER,
    "trackNumber" INTEGER,
    "discNumber" INTEGER,
    "posterUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Music_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comic" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "series" TEXT,
    "issue" INTEGER,
    "volume" TEXT,
    "publisher" TEXT,
    "pages" INTEGER,
    "description" TEXT,
    "posterUrl" TEXT,
    "year" INTEGER,
    "month" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "birthDate" TIMESTAMP(3),
    "deathDate" TIMESTAMP(3),
    "profileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,
    "character" TEXT,
    "order" INTEGER,
    "personId" TEXT NOT NULL,
    "movieId" TEXT,
    "tvShowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "isLibrary" BOOLEAN NOT NULL DEFAULT false,
    "libraryPath" TEXT,
    "libraryType" "MediaType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentId" TEXT,

    CONSTRAINT "Library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalId" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "movieId" TEXT,
    "tvShowId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalId_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanJob" (
    "id" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "scanPath" TEXT NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "status" "ScanJobStatus" NOT NULL DEFAULT 'PENDING',
    "metadataStatus" "MetadataJobStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "scannedCount" INTEGER NOT NULL DEFAULT 0,
    "metadataSuccessCount" INTEGER NOT NULL DEFAULT 0,
    "metadataFailedCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "metadataStartedAt" TIMESTAMP(3),
    "metadataCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScanJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetadataProvider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "config" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetadataProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "category" "SettingCategory" NOT NULL DEFAULT 'CUSTOM',
    "module" TEXT,
    "value" TEXT NOT NULL,
    "type" "SettingType" NOT NULL DEFAULT 'STRING',
    "displayName" TEXT,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GenreToMovie" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GenreToMovie_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_GenreToTVShow" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GenreToTVShow_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_LibraryToMovie" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LibraryToMovie_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_LibraryToTVShow" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_LibraryToTVShow_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaItem_filePath_key" ON "MediaItem"("filePath");

-- CreateIndex
CREATE INDEX "MediaItem_filePath_idx" ON "MediaItem"("filePath");

-- CreateIndex
CREATE INDEX "MediaItem_movieId_idx" ON "MediaItem"("movieId");

-- CreateIndex
CREATE INDEX "MediaItem_episodeId_idx" ON "MediaItem"("episodeId");

-- CreateIndex
CREATE INDEX "MediaItem_musicId_idx" ON "MediaItem"("musicId");

-- CreateIndex
CREATE INDEX "MediaItem_comicId_idx" ON "MediaItem"("comicId");

-- CreateIndex
CREATE INDEX "Movie_title_idx" ON "Movie"("title");

-- CreateIndex
CREATE INDEX "Movie_releaseDate_idx" ON "Movie"("releaseDate");

-- CreateIndex
CREATE INDEX "TVShow_title_idx" ON "TVShow"("title");

-- CreateIndex
CREATE INDEX "Season_tvShowId_idx" ON "Season"("tvShowId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_tvShowId_number_key" ON "Season"("tvShowId", "number");

-- CreateIndex
CREATE INDEX "Episode_seasonId_idx" ON "Episode"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_number_key" ON "Episode"("seasonId", "number");

-- CreateIndex
CREATE INDEX "Music_artist_idx" ON "Music"("artist");

-- CreateIndex
CREATE INDEX "Music_album_idx" ON "Music"("album");

-- CreateIndex
CREATE INDEX "Music_title_idx" ON "Music"("title");

-- CreateIndex
CREATE INDEX "Comic_series_idx" ON "Comic"("series");

-- CreateIndex
CREATE INDEX "Comic_publisher_idx" ON "Comic"("publisher");

-- CreateIndex
CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");

-- CreateIndex
CREATE INDEX "Person_name_idx" ON "Person"("name");

-- CreateIndex
CREATE INDEX "Credit_personId_idx" ON "Credit"("personId");

-- CreateIndex
CREATE INDEX "Credit_movieId_idx" ON "Credit"("movieId");

-- CreateIndex
CREATE INDEX "Credit_tvShowId_idx" ON "Credit"("tvShowId");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE INDEX "Genre_slug_idx" ON "Genre"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Library_slug_key" ON "Library"("slug");

-- CreateIndex
CREATE INDEX "Library_slug_idx" ON "Library"("slug");

-- CreateIndex
CREATE INDEX "Library_parentId_idx" ON "Library"("parentId");

-- CreateIndex
CREATE INDEX "ExternalId_externalId_idx" ON "ExternalId"("externalId");

-- CreateIndex
CREATE INDEX "ExternalId_movieId_idx" ON "ExternalId"("movieId");

-- CreateIndex
CREATE INDEX "ExternalId_tvShowId_idx" ON "ExternalId"("tvShowId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalId_source_externalId_key" ON "ExternalId"("source", "externalId");

-- CreateIndex
CREATE INDEX "ScanJob_libraryId_idx" ON "ScanJob"("libraryId");

-- CreateIndex
CREATE INDEX "ScanJob_status_idx" ON "ScanJob"("status");

-- CreateIndex
CREATE UNIQUE INDEX "MetadataProvider_name_key" ON "MetadataProvider"("name");

-- CreateIndex
CREATE INDEX "MetadataProvider_enabled_priority_idx" ON "MetadataProvider"("enabled", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");

-- CreateIndex
CREATE INDEX "Setting_category_idx" ON "Setting"("category");

-- CreateIndex
CREATE INDEX "Setting_module_idx" ON "Setting"("module");

-- CreateIndex
CREATE INDEX "_GenreToMovie_B_index" ON "_GenreToMovie"("B");

-- CreateIndex
CREATE INDEX "_GenreToTVShow_B_index" ON "_GenreToTVShow"("B");

-- CreateIndex
CREATE INDEX "_LibraryToMovie_B_index" ON "_LibraryToMovie"("B");

-- CreateIndex
CREATE INDEX "_LibraryToTVShow_B_index" ON "_LibraryToTVShow"("B");

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_musicId_fkey" FOREIGN KEY ("musicId") REFERENCES "Music"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaItem" ADD CONSTRAINT "MediaItem_comicId_fkey" FOREIGN KEY ("comicId") REFERENCES "Comic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TVShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TVShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Library" ADD CONSTRAINT "Library_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalId" ADD CONSTRAINT "ExternalId_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalId" ADD CONSTRAINT "ExternalId_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TVShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanJob" ADD CONSTRAINT "ScanJob_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToMovie" ADD CONSTRAINT "_GenreToMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToMovie" ADD CONSTRAINT "_GenreToMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToTVShow" ADD CONSTRAINT "_GenreToTVShow_A_fkey" FOREIGN KEY ("A") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GenreToTVShow" ADD CONSTRAINT "_GenreToTVShow_B_fkey" FOREIGN KEY ("B") REFERENCES "TVShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LibraryToMovie" ADD CONSTRAINT "_LibraryToMovie_A_fkey" FOREIGN KEY ("A") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LibraryToMovie" ADD CONSTRAINT "_LibraryToMovie_B_fkey" FOREIGN KEY ("B") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LibraryToTVShow" ADD CONSTRAINT "_LibraryToTVShow_A_fkey" FOREIGN KEY ("A") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LibraryToTVShow" ADD CONSTRAINT "_LibraryToTVShow_B_fkey" FOREIGN KEY ("B") REFERENCES "TVShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
