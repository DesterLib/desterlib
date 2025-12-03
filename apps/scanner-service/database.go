package main

import (
	"database/sql"
	"fmt"
	"path/filepath"

	"github.com/lib/pq"
)

type Database struct {
	db *sql.DB
}

func NewDatabase(databaseURL string) (*Database, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Database{db: db}, nil
}

func (d *Database) Close() error {
	return d.db.Close()
}

// SaveMedia saves media information to Movie/TVShow and MediaItem tables based on type
func (d *Database) SaveMedia(info *MovieInfo, libraryId, mediaType string) error {
	// Default to MOVIE if not specified
	if mediaType == "" {
		mediaType = "MOVIE"
	}

	filePath := filepath.Join(info.FolderPath, info.Filename)
	var contentId string // ID of the content metadata (Movie or TVShow)

	// 1. Check if FILE (MediaItem) already exists
	// We check MediaItem table instead of old Movie table
	var existingContentId string
	var query string
	
	if mediaType == "TV_SHOW" {
		// Not fully implemented in scan logic yet, but preparing
		// For TV shows, MediaItem usually links to Episode, which links to Season -> TVShow
		// But if we support flat file -> TVShow linking or direct check
		// For now, assuming MOVIE focus as per original code
	}

	if mediaType == "MOVIE" {
		err := d.db.QueryRow(`SELECT "movieId" FROM "MediaItem" WHERE "filePath" = $1`, filePath).Scan(&existingContentId)
		if err == nil && existingContentId != "" {
			// Found existing FILE, use its linked Content ID
			contentId = existingContentId
			// Update file stats
			_, err = d.db.Exec(`UPDATE "MediaItem" SET "fileSize" = $1, "fileModifiedAt" = $2, "updatedAt" = NOW() WHERE "filePath" = $3`, info.FileSize, info.MTime, filePath)
			if err != nil {
				return fmt.Errorf("failed to update media item stats: %w", err)
			}
		} else if err != nil && err != sql.ErrNoRows {
			return fmt.Errorf("failed to check existing media item: %w", err)
		}
	}

	// 2. If contentId is not found from file, check if a matching Content Metadata already exists (Title match)
	// This enables grouping multiple files under one Movie entry
	if contentId == "" && mediaType == "MOVIE" {
		query = `SELECT id FROM "Movie" WHERE "title" = $1`
		// We could match year if available, but keeping it simple as per original
		err := d.db.QueryRow(query, info.Title).Scan(&contentId)
		if err != nil && err != sql.ErrNoRows {
			return fmt.Errorf("failed to check existing movie metadata: %w", err)
		}
	}

	// 3. If contentId is still empty, create new Content Metadata (Movie)
	if contentId == "" {
		if mediaType == "MOVIE" {
			// Insert new Movie (Metadata)
			// Changed 'description' to 'overview' to match Prisma schema
			query := `
				INSERT INTO "Movie" (
					id, title, overview,
					"createdAt", "updatedAt"
				) VALUES (
					gen_random_uuid()::text,
					$1, -- title
					NULL,
					NOW(),
					NOW()
				)
				RETURNING id
			`
			err := d.db.QueryRow(query, info.Title).Scan(&contentId)
			if err != nil {
				return fmt.Errorf("failed to create movie metadata: %w", err)
			}
		} else {
			// TV_SHOW etc not fully implemented in this scanner pass
			// return fmt.Errorf("unsupported media type for creation: %s", mediaType)
		}
	}

	// 4. Now insert/update the MediaItem (File) record linked to this contentId
	if mediaType == "MOVIE" && contentId != "" {
		// Upsert MediaItem
		query := `
			INSERT INTO "MediaItem" (
				id, duration, "filePath", "fileSize",
				"fileModifiedAt", "movieId", "createdAt", "updatedAt"
			) VALUES (
				gen_random_uuid()::text,
				$1, -- duration
				$2, -- filePath
				$3, -- fileSize
				$4, -- mtime
				$5, -- movieId
				NOW(),
				NOW()
			)
			ON CONFLICT ("filePath") DO UPDATE SET
				"fileSize" = EXCLUDED."fileSize",
				"fileModifiedAt" = EXCLUDED."fileModifiedAt",
				"updatedAt" = NOW(),
				"movieId" = EXCLUDED."movieId" -- Ensure link is updated/set
			RETURNING id
		`
		
		var durationMinutes *int
		if info.Duration != nil {
			minutes := *info.Duration / 60
			durationMinutes = &minutes
		}
		
		var mediaItemId string
		err := d.db.QueryRow(query, durationMinutes, filePath, info.FileSize, info.MTime, contentId).Scan(&mediaItemId)
		if err != nil {
			return fmt.Errorf("failed to save media item record: %w", err)
		}
	}

	info.ID = contentId // Return the Content ID (Movie ID) for metadata processing

	// Link to library
	// Using Prisma naming convention: _LibraryToMovie (A=Library, B=Movie)
	if libraryId != "" && mediaType == "MOVIE" && contentId != "" {
		linkQuery := `
			INSERT INTO "_LibraryToMovie" ("A", "B")
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
		`
		_, err := d.db.Exec(linkQuery, libraryId, contentId)
		if err != nil {
			// Fallback: Try _LibraryMovies just in case
			fallbackQuery := `
				INSERT INTO "_LibraryMovies" ("A", "B")
				VALUES ($1, $2)
				ON CONFLICT DO NOTHING
			`
			_, err2 := d.db.Exec(fallbackQuery, libraryId, contentId)
			if err2 != nil {
				// Both failed
				fmt.Printf("Warning: failed to link library (tried _LibraryToMovie and _LibraryMovies): %v; %v\n", err, err2)
			}
		}
	}

	return nil
}

// CleanupLibrary removes entries from the library that were not present in the scan
func (d *Database) CleanupLibrary(libraryId string, foundMediaIds []string, foundFilePaths []string, scanRootPath string) (int64, int64, error) {
	if libraryId == "" || scanRootPath == "" {
		return 0, 0, nil
	}

	cleanRoot := filepath.Clean(scanRootPath)
	pathPattern := cleanRoot + "/%"
	exactPattern := cleanRoot

	tx, err := d.db.Begin()
	if err != nil {
		return 0, 0, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Delete stale MediaItem records (files that are gone)
	var itemsDeleted int64
	
	if len(foundFilePaths) > 0 {
		query := `
			DELETE FROM "MediaItem"
			WHERE ("filePath" LIKE $1 OR "filePath" = $2)
			AND NOT ("filePath" = ANY($3))
		`
		res, err := tx.Exec(query, pathPattern, exactPattern, pq.Array(foundFilePaths))
		if err != nil {
			return 0, 0, fmt.Errorf("failed to clean up stale media items: %w", err)
		}
		itemsDeleted, _ = res.RowsAffected()
	} else {
		query := `
			DELETE FROM "MediaItem"
			WHERE ("filePath" LIKE $1 OR "filePath" = $2)
		`
		res, err := tx.Exec(query, pathPattern, exactPattern)
		if err != nil {
			return 0, 0, fmt.Errorf("failed to clean up all media items: %w", err)
		}
		itemsDeleted, _ = res.RowsAffected()
	}

	// 2. Identify orphaned Movies (Movies with no MediaItems) and delete them
	// Only if they are in this library
	// Trying _LibraryToMovie first
	orphanQuery := `
		DELETE FROM "Movie"
		WHERE id NOT IN (SELECT DISTINCT "movieId" FROM "MediaItem" WHERE "movieId" IS NOT NULL)
		AND id IN (SELECT "B" FROM "_LibraryToMovie" WHERE "A" = $1)
	`
	orphanResult, err := tx.Exec(orphanQuery, libraryId)
	if err != nil {
		// Fallback to _LibraryMovies if that failed
		orphanQueryFallback := `
			DELETE FROM "Movie"
			WHERE id NOT IN (SELECT DISTINCT "movieId" FROM "MediaItem" WHERE "movieId" IS NOT NULL)
			AND id IN (SELECT "B" FROM "_LibraryMovies" WHERE "A" = $1)
		`
		orphanResult, err = tx.Exec(orphanQueryFallback, libraryId)
		if err != nil {
			return itemsDeleted, 0, fmt.Errorf("failed to clean up orphaned movies (tried _LibraryToMovie and _LibraryMovies): %w", err)
		}
	}

	orphansDeleted, _ := orphanResult.RowsAffected()

	if err := tx.Commit(); err != nil {
		return itemsDeleted, orphansDeleted, fmt.Errorf("failed to commit cleanup: %w", err)
	}

	return itemsDeleted, orphansDeleted, nil
}

// UpdateScanJobStatus updates the status of a scan job
func (d *Database) UpdateScanJobStatus(scanJobId, status string) error {
	var query string
	if status == "IN_PROGRESS" {
		query = `
			UPDATE "ScanJob" 
			SET status = $1::"ScanJobStatus",
				"startedAt" = COALESCE("startedAt", NOW()),
				"updatedAt" = NOW()
			WHERE id = $2
		`
	} else if status == "COMPLETED" {
		query = `
			UPDATE "ScanJob" 
			SET status = $1::"ScanJobStatus",
				"completedAt" = NOW(),
				"updatedAt" = NOW()
			WHERE id = $2
		`
	} else if status == "FAILED" {
		query = `
			UPDATE "ScanJob" 
			SET status = $1::"ScanJobStatus",
				"completedAt" = NOW(),
				"updatedAt" = NOW()
			WHERE id = $2
		`
	} else {
		query = `
			UPDATE "ScanJob" 
			SET status = $1::"ScanJobStatus",
				"updatedAt" = NOW()
			WHERE id = $2
		`
	}

	_, err := d.db.Exec(query, status, scanJobId)
	if err != nil {
		return fmt.Errorf("failed to update scan job status: %w", err)
	}
	return nil
}

// IncrementScanJobScannedCount increments the scannedCount for a scan job
func (d *Database) IncrementScanJobScannedCount(scanJobId string) error {
	_, err := d.db.Exec(`
		UPDATE "ScanJob" 
		SET "scannedCount" = "scannedCount" + 1,
			"updatedAt" = NOW()
		WHERE id = $1
	`, scanJobId)
	if err != nil {
		return fmt.Errorf("failed to increment scan job scanned count: %w", err)
	}
	return nil
}
