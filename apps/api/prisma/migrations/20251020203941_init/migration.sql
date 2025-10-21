-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'TV_SHOW', 'MUSIC', 'COMIC');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ACTOR', 'DIRECTOR', 'WRITER', 'PRODUCER', 'ARTIST', 'COMPOSER', 'AUTHOR');

-- CreateEnum
CREATE TYPE "ExternalIdSource" AS ENUM ('TMDB', 'IMDB', 'TVDB', 'ANIDB', 'MYANIMELIST', 'MUSICBRAINZ', 'SPOTIFY', 'COMICVINE', 'OTHER');

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "description" TEXT,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "releaseDate" TIMESTAMP(3),
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL,
    "duration" INTEGER,
    "trailerUrl" TEXT,
    "filePath" TEXT,
    "fileSize" BIGINT,
    "fileModifiedAt" TIMESTAMP(3),
    "mediaId" TEXT NOT NULL,

    CONSTRAINT "Movie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TVShow" (
    "id" TEXT NOT NULL,
    "creator" TEXT,
    "network" TEXT,
    "mediaId" TEXT NOT NULL,

    CONSTRAINT "TVShow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "posterUrl" TEXT,
    "tvShowId" TEXT NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileTitle" TEXT,
    "number" INTEGER NOT NULL,
    "duration" INTEGER,
    "airDate" TIMESTAMP(3),
    "stillPath" TEXT,
    "filePath" TEXT,
    "fileSize" BIGINT,
    "fileModifiedAt" TIMESTAMP(3),
    "seasonId" TEXT NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Music" (
    "id" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "genre" TEXT,
    "duration" INTEGER,
    "filePath" TEXT,
    "fileSize" BIGINT,
    "fileModifiedAt" TIMESTAMP(3),
    "mediaId" TEXT NOT NULL,

    CONSTRAINT "Music_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comic" (
    "id" TEXT NOT NULL,
    "issue" INTEGER,
    "volume" TEXT,
    "publisher" TEXT,
    "pages" INTEGER,
    "filePath" TEXT,
    "fileSize" BIGINT,
    "fileModifiedAt" TIMESTAMP(3),
    "mediaId" TEXT NOT NULL,

    CONSTRAINT "Comic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "birthDate" TIMESTAMP(3),
    "profileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaPerson" (
    "id" TEXT NOT NULL,
    "role" "RoleType" NOT NULL,
    "mediaId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "character" TEXT,

    CONSTRAINT "MediaPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaGenre" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "MediaGenre_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "MediaLibrary" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "libraryId" TEXT NOT NULL,
    "order" INTEGER,

    CONSTRAINT "MediaLibrary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalId" (
    "id" TEXT NOT NULL,
    "source" "ExternalIdSource" NOT NULL,
    "externalId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalId_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Media_type_idx" ON "Media"("type");

-- CreateIndex
CREATE INDEX "Media_releaseDate_idx" ON "Media"("releaseDate");

-- CreateIndex
CREATE INDEX "Media_rating_idx" ON "Media"("rating");

-- CreateIndex
CREATE INDEX "Media_title_idx" ON "Media"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_filePath_key" ON "Movie"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "Movie_mediaId_key" ON "Movie"("mediaId");

-- CreateIndex
CREATE INDEX "Movie_filePath_idx" ON "Movie"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "TVShow_mediaId_key" ON "TVShow"("mediaId");

-- CreateIndex
CREATE INDEX "Season_tvShowId_idx" ON "Season"("tvShowId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_tvShowId_number_key" ON "Season"("tvShowId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_filePath_key" ON "Episode"("filePath");

-- CreateIndex
CREATE INDEX "Episode_seasonId_idx" ON "Episode"("seasonId");

-- CreateIndex
CREATE INDEX "Episode_filePath_idx" ON "Episode"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_number_key" ON "Episode"("seasonId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Music_filePath_key" ON "Music"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "Music_mediaId_key" ON "Music"("mediaId");

-- CreateIndex
CREATE INDEX "Music_artist_idx" ON "Music"("artist");

-- CreateIndex
CREATE INDEX "Music_genre_idx" ON "Music"("genre");

-- CreateIndex
CREATE INDEX "Music_filePath_idx" ON "Music"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "Comic_filePath_key" ON "Comic"("filePath");

-- CreateIndex
CREATE UNIQUE INDEX "Comic_mediaId_key" ON "Comic"("mediaId");

-- CreateIndex
CREATE INDEX "Comic_publisher_idx" ON "Comic"("publisher");

-- CreateIndex
CREATE INDEX "Comic_filePath_idx" ON "Comic"("filePath");

-- CreateIndex
CREATE INDEX "Person_name_idx" ON "Person"("name");

-- CreateIndex
CREATE INDEX "MediaPerson_mediaId_idx" ON "MediaPerson"("mediaId");

-- CreateIndex
CREATE INDEX "MediaPerson_personId_idx" ON "MediaPerson"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaPerson_mediaId_personId_role_key" ON "MediaPerson"("mediaId", "personId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE INDEX "Genre_slug_idx" ON "Genre"("slug");

-- CreateIndex
CREATE INDEX "Genre_name_idx" ON "Genre"("name");

-- CreateIndex
CREATE INDEX "MediaGenre_mediaId_idx" ON "MediaGenre"("mediaId");

-- CreateIndex
CREATE INDEX "MediaGenre_genreId_idx" ON "MediaGenre"("genreId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaGenre_mediaId_genreId_key" ON "MediaGenre"("mediaId", "genreId");

-- CreateIndex
CREATE UNIQUE INDEX "Library_slug_key" ON "Library"("slug");

-- CreateIndex
CREATE INDEX "Library_slug_idx" ON "Library"("slug");

-- CreateIndex
CREATE INDEX "Library_parentId_idx" ON "Library"("parentId");

-- CreateIndex
CREATE INDEX "Library_isLibrary_idx" ON "Library"("isLibrary");

-- CreateIndex
CREATE INDEX "Library_libraryPath_idx" ON "Library"("libraryPath");

-- CreateIndex
CREATE INDEX "MediaLibrary_mediaId_idx" ON "MediaLibrary"("mediaId");

-- CreateIndex
CREATE INDEX "MediaLibrary_libraryId_idx" ON "MediaLibrary"("libraryId");

-- CreateIndex
CREATE INDEX "MediaLibrary_order_idx" ON "MediaLibrary"("order");

-- CreateIndex
CREATE UNIQUE INDEX "MediaLibrary_mediaId_libraryId_key" ON "MediaLibrary"("mediaId", "libraryId");

-- CreateIndex
CREATE INDEX "ExternalId_mediaId_idx" ON "ExternalId"("mediaId");

-- CreateIndex
CREATE INDEX "ExternalId_externalId_idx" ON "ExternalId"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalId_source_externalId_key" ON "ExternalId"("source", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalId_source_mediaId_key" ON "ExternalId"("source", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE INDEX "Settings_key_idx" ON "Settings"("key");

-- AddForeignKey
ALTER TABLE "Movie" ADD CONSTRAINT "Movie_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TVShow" ADD CONSTRAINT "TVShow_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TVShow"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Music" ADD CONSTRAINT "Music_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comic" ADD CONSTRAINT "Comic_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaPerson" ADD CONSTRAINT "MediaPerson_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaPerson" ADD CONSTRAINT "MediaPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaGenre" ADD CONSTRAINT "MediaGenre_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaGenre" ADD CONSTRAINT "MediaGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Library" ADD CONSTRAINT "Library_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaLibrary" ADD CONSTRAINT "MediaLibrary_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaLibrary" ADD CONSTRAINT "MediaLibrary_libraryId_fkey" FOREIGN KEY ("libraryId") REFERENCES "Library"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalId" ADD CONSTRAINT "ExternalId_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
