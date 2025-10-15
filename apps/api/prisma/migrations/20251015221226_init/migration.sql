-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('MOVIE', 'TV_SHOW', 'MUSIC', 'COMIC');

-- CreateEnum
CREATE TYPE "RoleType" AS ENUM ('ACTOR', 'DIRECTOR', 'WRITER', 'PRODUCER', 'ARTIST', 'COMPOSER', 'AUTHOR');

-- CreateEnum
CREATE TYPE "ExternalIdSource" AS ENUM ('TMDB', 'IMDB', 'TVDB', 'ANIDB', 'MYANIMELIST', 'MUSICBRAINZ', 'SPOTIFY', 'COMICVINE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER', 'GUEST');

-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('PASSWORD', 'PIN', 'PASSWORDLESS');

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
    "director" TEXT,
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
    "tvShowId" TEXT NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "duration" INTEGER,
    "airDate" TIMESTAMP(3),
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
CREATE TABLE "Collection" (
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
    "settingsId" TEXT,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaCollection" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "order" INTEGER,

    CONSTRAINT "MediaCollection_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "avatar" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "passwordHash" TEXT,
    "pinHash" TEXT,
    "isPasswordless" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "scopes" TEXT NOT NULL DEFAULT '*',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "isSetupComplete" BOOLEAN NOT NULL DEFAULT false,
    "tmdbApiKey" TEXT,
    "requireAuth" BOOLEAN NOT NULL DEFAULT true,
    "allowRegistration" BOOLEAN NOT NULL DEFAULT false,
    "sessionDuration" INTEGER NOT NULL DEFAULT 604800,
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
CREATE INDEX "MediaGenre_mediaId_idx" ON "MediaGenre"("mediaId");

-- CreateIndex
CREATE INDEX "MediaGenre_genreId_idx" ON "MediaGenre"("genreId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaGenre_mediaId_genreId_key" ON "MediaGenre"("mediaId", "genreId");

-- CreateIndex
CREATE UNIQUE INDEX "Collection_slug_key" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_slug_idx" ON "Collection"("slug");

-- CreateIndex
CREATE INDEX "Collection_parentId_idx" ON "Collection"("parentId");

-- CreateIndex
CREATE INDEX "Collection_isLibrary_idx" ON "Collection"("isLibrary");

-- CreateIndex
CREATE INDEX "Collection_settingsId_idx" ON "Collection"("settingsId");

-- CreateIndex
CREATE INDEX "MediaCollection_mediaId_idx" ON "MediaCollection"("mediaId");

-- CreateIndex
CREATE INDEX "MediaCollection_collectionId_idx" ON "MediaCollection"("collectionId");

-- CreateIndex
CREATE INDEX "MediaCollection_order_idx" ON "MediaCollection"("order");

-- CreateIndex
CREATE UNIQUE INDEX "MediaCollection_mediaId_collectionId_key" ON "MediaCollection"("mediaId", "collectionId");

-- CreateIndex
CREATE INDEX "ExternalId_mediaId_idx" ON "ExternalId"("mediaId");

-- CreateIndex
CREATE INDEX "ExternalId_externalId_idx" ON "ExternalId"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalId_source_externalId_key" ON "ExternalId"("source", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalId_source_mediaId_key" ON "ExternalId"("source", "mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_token_idx" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_keyPrefix_idx" ON "ApiKey"("keyPrefix");

-- CreateIndex
CREATE INDEX "ApiKey_isActive_idx" ON "ApiKey"("isActive");

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
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "Settings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaCollection" ADD CONSTRAINT "MediaCollection_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaCollection" ADD CONSTRAINT "MediaCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalId" ADD CONSTRAINT "ExternalId_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
