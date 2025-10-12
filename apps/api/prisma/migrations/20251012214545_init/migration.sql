-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "releaseDate" DATETIME,
    "rating" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Movie" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "duration" INTEGER,
    "director" TEXT,
    "trailerUrl" TEXT,
    "mediaId" TEXT NOT NULL,
    CONSTRAINT "Movie_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TVShow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creator" TEXT,
    "network" TEXT,
    "mediaId" TEXT NOT NULL,
    CONSTRAINT "TVShow_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" INTEGER NOT NULL,
    "tvShowId" TEXT NOT NULL,
    CONSTRAINT "Season_tvShowId_fkey" FOREIGN KEY ("tvShowId") REFERENCES "TVShow" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "duration" INTEGER,
    "airDate" DATETIME,
    "videoUrl" TEXT,
    "seasonId" TEXT NOT NULL,
    CONSTRAINT "Episode_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Music" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "artist" TEXT NOT NULL,
    "album" TEXT,
    "genre" TEXT,
    "duration" INTEGER,
    "trackUrl" TEXT,
    "mediaId" TEXT NOT NULL,
    CONSTRAINT "Music_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issue" INTEGER,
    "volume" TEXT,
    "publisher" TEXT,
    "pages" INTEGER,
    "fileUrl" TEXT,
    "mediaId" TEXT NOT NULL,
    CONSTRAINT "Comic_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "birthDate" DATETIME,
    "profileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MediaPerson" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "character" TEXT,
    CONSTRAINT "MediaPerson_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MediaPerson_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MediaGenre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mediaId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,
    CONSTRAINT "MediaGenre_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MediaGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "posterUrl" TEXT,
    "backdropUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "parentId" TEXT,
    CONSTRAINT "Collection_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MediaCollection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mediaId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "order" INTEGER,
    CONSTRAINT "MediaCollection_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MediaCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExternalId" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ExternalId_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "Media" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE UNIQUE INDEX "Movie_mediaId_key" ON "Movie"("mediaId");

-- CreateIndex
CREATE UNIQUE INDEX "TVShow_mediaId_key" ON "TVShow"("mediaId");

-- CreateIndex
CREATE INDEX "Season_tvShowId_idx" ON "Season"("tvShowId");

-- CreateIndex
CREATE UNIQUE INDEX "Season_tvShowId_number_key" ON "Season"("tvShowId", "number");

-- CreateIndex
CREATE INDEX "Episode_seasonId_idx" ON "Episode"("seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_seasonId_number_key" ON "Episode"("seasonId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Music_mediaId_key" ON "Music"("mediaId");

-- CreateIndex
CREATE INDEX "Music_artist_idx" ON "Music"("artist");

-- CreateIndex
CREATE INDEX "Music_genre_idx" ON "Music"("genre");

-- CreateIndex
CREATE UNIQUE INDEX "Comic_mediaId_key" ON "Comic"("mediaId");

-- CreateIndex
CREATE INDEX "Comic_publisher_idx" ON "Comic"("publisher");

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
