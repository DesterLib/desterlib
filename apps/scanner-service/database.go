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

// SaveMedia saves media information to Media and related tables based on type
func (d *Database) SaveMedia(info *MovieInfo, libraryId, mediaType string) error {
	// Default to MOVIE if not specified
	if mediaType == "" {
		mediaType = "MOVIE"
	}

	filePath := filepath.Join(info.FolderPath, info.Filename)
	var mediaId string

	// For MOVIE, check if file already exists to avoid duplicates
	if mediaType == "MOVIE" {
		// Check for existing movie file
		var existingMediaId string
		err := d.db.QueryRow(`SELECT "mediaId" FROM "Movie" WHERE "filePath" = $1`, filePath).Scan(&existingMediaId)
		if err == nil {
			// Found existing FILE, use its Media ID
			mediaId = existingMediaId
			// Ideally update file size/time if changed
			_, err = d.db.Exec(`UPDATE "Movie" SET "fileSize" = $1, "fileModifiedAt" = $2, "updatedAt" = NOW() WHERE "filePath" = $3`, info.FileSize, info.MTime, filePath)
			if err != nil {
				return fmt.Errorf("failed to update movie stats: %w", err)
			}
		} else if err != sql.ErrNoRows {
			return fmt.Errorf("failed to check existing movie: %w", err)
		}
	}

	// If not found, check if a matching Media (metadata) already exists (Title + Year)
	// This enables grouping multiple files under one Media entry
	if mediaId == "" {
		var query string
		var args []interface{}
		
		query = `SELECT id FROM "Media" WHERE "title" = $1 AND "type" = $2`
		args = []interface{}{info.Title, mediaType}
		
		if info.Year != nil {
			// If year is available, include it in matching logic
			// Note: Media uses 'releaseDate', we check if the year part matches
			// Since releaseDate is full date, we use EXTRACT(YEAR)
			// But releaseDate might be null.
			// Let's rely on Title match primarily, or maybe skip strict year match to avoid complexity with SQL dates vs Int year
			// For safety, let's just match Title for now, OR improve query to match year if possible.
			// Ideally we want: title = $1 AND EXTRACT(YEAR FROM "releaseDate") = $3
			// But setting releaseDate is not done yet (it's null initially).
			// So matching by Title alone is the best we can do for initial scan.
			// Metadata service will populate releaseDate later.
		}
		
		err := d.db.QueryRow(query, args...).Scan(&mediaId)
		if err != nil && err != sql.ErrNoRows {
			return fmt.Errorf("failed to check existing media: %w", err)
		}
	}

	// If mediaId is still empty, create new Media
	if mediaId == "" {
		if mediaType == "MOVIE" || mediaType == "TV_SHOW" || mediaType == "MUSIC" || mediaType == "COMIC" {
			// Insert new Media
			query := `
				INSERT INTO "Media" (
					id, title, type, description,
					"createdAt", "updatedAt"
				) VALUES (
					gen_random_uuid()::text,
					$1, -- title
					$2::"MediaType",
					NULL,
					NOW(),
					NOW()
				)
				RETURNING id
			`
			err := d.db.QueryRow(query, info.Title, mediaType).Scan(&mediaId)
			if err != nil {
				return fmt.Errorf("failed to create media: %w", err)
			}
		} else {
			return fmt.Errorf("unsupported media type: %s", mediaType)
		}
	}

	// Now insert/update the Movie/File record linked to this mediaId
	if mediaType == "MOVIE" {
		// Check if this specific file is already linked (we might have updated stats above, but if it's a new file for existing media...)
		// Using UPSERT style or just INSERT ON CONFLICT
		query := `
			INSERT INTO "Movie" (
				id, duration, "filePath", "fileSize",
				"fileModifiedAt", "mediaId", "createdAt", "updatedAt"
			) VALUES (
				gen_random_uuid()::text,
				$1, -- duration
				$2, -- filePath
				$3, -- fileSize
				$4, -- mtime
				$5, -- mediaId
				NOW(),
				NOW()
			)
			ON CONFLICT ("filePath") DO UPDATE SET
				"fileSize" = EXCLUDED."fileSize",
				"fileModifiedAt" = EXCLUDED."fileModifiedAt",
				"updatedAt" = NOW()
			RETURNING id
		`
		
		var durationMinutes *int
		if info.Duration != nil {
			minutes := *info.Duration / 60
			durationMinutes = &minutes
		}
		
		var movieId string
		err := d.db.QueryRow(query, durationMinutes, filePath, info.FileSize, info.MTime, mediaId).Scan(&movieId)
		if err != nil {
			return fmt.Errorf("failed to save movie file record: %w", err)
		}
	} else {
		// For other types, we need similar logic (Episode, Music, Comic tables)
		// Assuming we focus on Movie for now as per request
		// If TV_SHOW, we can't easily insert into "Episode" without Season structure.
		// So we skip specific table insert for now if not Movie.
	}

	info.ID = mediaId

	// Link to library
	if libraryId != "" {
		linkQuery := `
			INSERT INTO "MediaLibrary" (id, "mediaId", "libraryId", "order", "createdAt", "updatedAt")
			VALUES (gen_random_uuid()::text, $1, $2, 0, NOW(), NOW())
			ON CONFLICT ("mediaId", "libraryId") DO NOTHING
		`
		_, err := d.db.Exec(linkQuery, mediaId, libraryId)
		if err != nil {
			return fmt.Errorf("failed to link media to library: %w", err)
		}
	}

	return nil
}

// CleanupLibrary removes entries from the library that were not present in the scan
func (d *Database) CleanupLibrary(libraryId string, foundMediaIds []string, foundFilePaths []string, scanRootPath string) (int64, int64, error) {
	if libraryId == "" || scanRootPath == "" {
		return 0, 0, nil
	}

	if !filepath.IsAbs(scanRootPath) {
		// assuming absolute paths usually
	}
	cleanRoot := filepath.Clean(scanRootPath)
	pathPattern := cleanRoot + "/%"
	exactPattern := cleanRoot

	// Start transaction
	tx, err := d.db.Begin()
	if err != nil {
		return 0, 0, fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer tx.Rollback()

	// 1. Delete stale Movie records (files that are gone)
	// We check for Movies that are within the scan root but NOT in foundFilePaths
	var moviesDeleted int64
	
	if len(foundFilePaths) > 0 {
		query := `
			DELETE FROM "Movie"
			WHERE ("filePath" LIKE $1 OR "filePath" = $2)
			AND NOT ("filePath" = ANY($3))
			AND "mediaId" IN (SELECT "mediaId" FROM "MediaLibrary" WHERE "libraryId" = $4)
		`
		res, err := tx.Exec(query, pathPattern, exactPattern, pq.Array(foundFilePaths), libraryId)
		if err != nil {
			return 0, 0, fmt.Errorf("failed to clean up stale movie files: %w", err)
		}
		moviesDeleted, _ = res.RowsAffected()
	} else {
		// If no files found, delete ALL movies in this path for this library
		query := `
			DELETE FROM "Movie"
			WHERE ("filePath" LIKE $1 OR "filePath" = $2)
			AND "mediaId" IN (SELECT "mediaId" FROM "MediaLibrary" WHERE "libraryId" = $3)
		`
		res, err := tx.Exec(query, pathPattern, exactPattern, libraryId)
		if err != nil {
			return 0, 0, fmt.Errorf("failed to clean up all movie files: %w", err)
		}
		moviesDeleted, _ = res.RowsAffected()
	}

	// 2. Identify orphaned media (media with no Movies left) and delete them
	// Since we allow 1 Media -> N Movies, if all Movies are deleted, the Media should arguably be deleted 
	// (or at least unlinked from library if it was only in this library).
	// However, a Media could theoretically be linked to files in OTHER folders (if 1 library spans multiple folders).
	// We should check if the Media has ANY movies left.
	
	// Delete Media if it is Type=MOVIE and has NO associated Movie records
	orphanQuery := `
		DELETE FROM "Media"
		WHERE "type" = 'MOVIE'
		AND id NOT IN (SELECT DISTINCT "mediaId" FROM "Movie")
		AND id IN (SELECT "mediaId" FROM "MediaLibrary" WHERE "libraryId" = $1)
	`
	orphanResult, err := tx.Exec(orphanQuery, libraryId)
	if err != nil {
		return moviesDeleted, 0, fmt.Errorf("failed to clean up orphaned media: %w", err)
	}

	orphansDeleted, _ := orphanResult.RowsAffected()

	if err := tx.Commit(); err != nil {
		return moviesDeleted, orphansDeleted, fmt.Errorf("failed to commit cleanup: %w", err)
	}

	return moviesDeleted, orphansDeleted, nil
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
// This tracks the number of files that have been scanned
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
