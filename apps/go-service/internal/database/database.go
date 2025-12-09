package database

import (
	"database/sql"
	"fmt"
	"path/filepath"
	"strings"
	"crypto/rand"
	"encoding/hex"

	_ "modernc.org/sqlite"
	"github.com/dester/go-service/models"
)

// generateUUID generates a UUID v4-like string for SQLite
// Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
func generateUUID() string {
	b := make([]byte, 16)
	rand.Read(b)
	
	// Set version (4) and variant bits
	b[6] = (b[6] & 0x0f) | 0x40 // Version 4
	b[8] = (b[8] & 0x3f) | 0x80 // Variant 10
	
	return fmt.Sprintf("%s-%s-4%s-%s-%s",
		hex.EncodeToString(b[0:4]),
		hex.EncodeToString(b[4:6]),
		hex.EncodeToString(b[6:7]),
		hex.EncodeToString(b[7:8]),
		hex.EncodeToString(b[8:16]))
}

// Database provides database operations
type Database struct {
	db *sql.DB
}

// New creates a new database connection
func New(databaseURL string) (*Database, error) {
	// modernc.org/sqlite accepts:
	// - Direct file paths: /path/to/db
	// - file: protocol: file:/path/to/db
	// - sqlite: protocol: sqlite:/path/to/db
	// We'll use the URL as-is since config.go already handles conversion
	driverURL := databaseURL
	
	// If it's a plain path (no protocol), use as-is
	// If it has file: or sqlite: prefix, use as-is
	// The driver will handle all these formats

	db, err := sql.Open("sqlite", driverURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Enable foreign keys for SQLite
	_, err = db.Exec("PRAGMA foreign_keys = ON")
	if err != nil {
		return nil, fmt.Errorf("failed to enable foreign keys: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	return &Database{db: db}, nil
}

// Close closes the database connection
func (d *Database) Close() error {
	return d.db.Close()
}

// SaveMedia saves media information to Movie/TVShow and MediaItem tables based on type
func (d *Database) SaveMedia(info *models.MovieInfo, libraryId, mediaType string) error {
	// Default to MOVIE if not specified
	if mediaType == "" {
		mediaType = "MOVIE"
	}

	filePath := filepath.Join(info.FolderPath, info.Filename)
	var contentId string // ID of the content metadata (Movie or TVShow)

	if mediaType == "TV_SHOW" {
		// TODO: Implement TV_SHOW support in scanner
		// TV shows require more complex handling:
		// - MediaItem links to Episode
		// - Episode links to Season
		// - Season links to TVShow
		// For now, return an error to prevent silent failures
		return fmt.Errorf("TV_SHOW media type is not yet supported in scanner service")
	}

	if mediaType == "MOVIE" {
		var existingContentId string
		err := d.db.QueryRow(`SELECT "movieId" FROM "MediaItem" WHERE "filePath" = $1`, filePath).Scan(&existingContentId)
		if err == nil && existingContentId != "" {
			// Found existing FILE, use its linked Content ID
			contentId = existingContentId
		// Update file stats
		_, err = d.db.Exec(`UPDATE "MediaItem" SET "fileSize" = $1, "fileModifiedAt" = $2, "updatedAt" = datetime('now') WHERE "filePath" = $3`, info.FileSize, info.MTime, filePath)
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
		query := `SELECT id FROM "Movie" WHERE "title" = $1`
		// We could match year if available, but keeping it simple as per original
		err := d.db.QueryRow(query, info.Title).Scan(&contentId)
		if err != nil && err != sql.ErrNoRows {
			return fmt.Errorf("failed to check existing movie metadata: %w", err)
		}
	}

	// 3. If contentId is still empty, create new Content Metadata (Movie)
	if contentId == "" {
		if mediaType == "MOVIE" {
			// Generate UUID for SQLite (simple hex-based UUID v4-like)
			// SQLite doesn't have gen_random_uuid(), so we generate it in Go
			contentId = generateUUID()
			
			// Insert new Movie (Metadata)
			// Changed 'description' to 'overview' to match Prisma schema
			query := `
				INSERT INTO "Movie" (
					id, title, overview,
					"createdAt", "updatedAt"
				) VALUES (
					$1, -- id
					$2, -- title
					NULL,
					datetime('now'),
					datetime('now')
				)
			`
			_, err := d.db.Exec(query, contentId, info.Title)
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
		var durationMinutes *int
		if info.Duration != nil {
			minutes := *info.Duration / 60
			durationMinutes = &minutes
		}
		
		// Check if MediaItem already exists
		var existingId string
		err := d.db.QueryRow(`SELECT id FROM "MediaItem" WHERE "filePath" = $1`, filePath).Scan(&existingId)
		
		if err == sql.ErrNoRows {
			// Insert new MediaItem
			mediaItemId := generateUUID()
			query := `
				INSERT INTO "MediaItem" (
					id, duration, "filePath", "fileSize",
					"fileModifiedAt", "movieId", "createdAt", "updatedAt"
				) VALUES (
					$1, -- id
					$2, -- duration
					$3, -- filePath
					$4, -- fileSize
					$5, -- mtime
					$6, -- movieId
					datetime('now'),
					datetime('now')
				)
			`
			_, err = d.db.Exec(query, mediaItemId, durationMinutes, filePath, info.FileSize, info.MTime, contentId)
			if err != nil {
				return fmt.Errorf("failed to save media item record: %w", err)
			}
		} else if err != nil {
			return fmt.Errorf("failed to check existing media item: %w", err)
		} else {
			// Update existing MediaItem
			query := `
				UPDATE "MediaItem" SET
					"fileSize" = $1,
					"fileModifiedAt" = $2,
					"updatedAt" = datetime('now'),
					"movieId" = $3,
					duration = $4
				WHERE "filePath" = $5
			`
			_, err = d.db.Exec(query, info.FileSize, info.MTime, contentId, durationMinutes, filePath)
			if err != nil {
				return fmt.Errorf("failed to update media item record: %w", err)
			}
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

// SaveTVShow saves TV show information to TVShow/Season/Episode and MediaItem tables
func (d *Database) SaveTVShow(info *models.TVShowInfo, libraryId, mediaType string) error {
	filePath := filepath.Join(info.FolderPath, info.Filename)
	var tvShowId string // ID of the TVShow

	// 1. Check if MediaItem already exists (by file path)
	var existingEpisodeId string
	err := d.db.QueryRow(`SELECT "episodeId" FROM "MediaItem" WHERE "filePath" = $1`, filePath).Scan(&existingEpisodeId)
	if err == nil && existingEpisodeId != "" {
		// Found existing file, get the TVShow ID from Episode -> Season -> TVShow
		var existingSeasonId string
		err = d.db.QueryRow(`SELECT "seasonId" FROM "Episode" WHERE id = $1`, existingEpisodeId).Scan(&existingSeasonId)
		if err == nil && existingSeasonId != "" {
			err = d.db.QueryRow(`SELECT "tvShowId" FROM "Season" WHERE id = $1`, existingSeasonId).Scan(&tvShowId)
			if err == nil && tvShowId != "" {
				// Update file stats
				_, err = d.db.Exec(`UPDATE "MediaItem" SET "fileSize" = $1, "fileModifiedAt" = $2, "updatedAt" = datetime('now') WHERE "filePath" = $3`, info.FileSize, info.MTime, filePath)
				if err != nil {
					return fmt.Errorf("failed to update media item stats: %w", err)
				}
				info.ID = tvShowId
				// Link to library if needed
				if libraryId != "" {
					linkQuery := `
						INSERT INTO "_LibraryToTVShow" ("A", "B")
						VALUES ($1, $2)
						ON CONFLICT DO NOTHING
					`
					d.db.Exec(linkQuery, libraryId, tvShowId)
				}
				return nil
			}
		}
	} else if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check existing media item: %w", err)
	}

	// 2. Find or create TVShow by title
	query := `SELECT id FROM "TVShow" WHERE "title" = $1`
	err = d.db.QueryRow(query, info.Title).Scan(&tvShowId)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check existing TV show: %w", err)
	}

	// 3. Create TVShow if it doesn't exist
	if tvShowId == "" {
		tvShowId = generateUUID()
		query := `
			INSERT INTO "TVShow" (
				id, title, overview,
				"createdAt", "updatedAt"
			) VALUES (
				$1, -- id
				$2, -- title
				NULL,
				datetime('now'),
				datetime('now')
			)
		`
		_, err = d.db.Exec(query, tvShowId, info.Title)
		if err != nil {
			return fmt.Errorf("failed to create TV show metadata: %w", err)
		}
	}

	// 4. Find or create Season
	var seasonId string
	seasonQuery := `SELECT id FROM "Season" WHERE "tvShowId" = $1 AND "number" = $2`
	err = d.db.QueryRow(seasonQuery, tvShowId, info.SeasonNumber).Scan(&seasonId)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check existing season: %w", err)
	}

	if seasonId == "" {
		seasonId = generateUUID()
		seasonInsertQuery := `
			INSERT INTO "Season" (
				id, number, "tvShowId",
				"createdAt", "updatedAt"
			) VALUES (
				$1, -- id
				$2, -- number
				$3, -- tvShowId
				datetime('now'),
				datetime('now')
			)
		`
		_, err = d.db.Exec(seasonInsertQuery, seasonId, info.SeasonNumber, tvShowId)
		if err != nil {
			return fmt.Errorf("failed to create season: %w", err)
		}
	}

	// 5. Find or create Episode
	var episodeId string
	episodeQuery := `SELECT id FROM "Episode" WHERE "seasonId" = $1 AND "number" = $2`
	err = d.db.QueryRow(episodeQuery, seasonId, info.EpisodeNumber).Scan(&episodeId)
	if err != nil && err != sql.ErrNoRows {
		return fmt.Errorf("failed to check existing episode: %w", err)
	}

	if episodeId == "" {
		episodeId = generateUUID()
		episodeInsertQuery := `
			INSERT INTO "Episode" (
				id, number, "seasonId", title,
				"createdAt", "updatedAt"
			) VALUES (
				$1, -- id
				$2, -- number
				$3, -- seasonId
				$4, -- title (use filename for now)
				datetime('now'),
				datetime('now')
			)
		`
		_, err = d.db.Exec(episodeInsertQuery, episodeId, info.EpisodeNumber, seasonId, info.Filename)
		if err != nil {
			return fmt.Errorf("failed to create episode: %w", err)
		}
	}

	// 6. Create or update MediaItem linked to Episode
	var durationMinutes *int
	if info.Duration != nil {
		minutes := *info.Duration / 60
		durationMinutes = &minutes
	}

	var existingMediaItemId string
	err = d.db.QueryRow(`SELECT id FROM "MediaItem" WHERE "filePath" = $1`, filePath).Scan(&existingMediaItemId)

	if err == sql.ErrNoRows {
		// Insert new MediaItem
		mediaItemId := generateUUID()
		query := `
			INSERT INTO "MediaItem" (
				id, duration, "filePath", "fileSize",
				"fileModifiedAt", "episodeId", "createdAt", "updatedAt"
			) VALUES (
				$1, -- id
				$2, -- duration
				$3, -- filePath
				$4, -- fileSize
				$5, -- mtime
				$6, -- episodeId
				datetime('now'),
				datetime('now')
			)
		`
		_, err = d.db.Exec(query, mediaItemId, durationMinutes, filePath, info.FileSize, info.MTime, episodeId)
		if err != nil {
			return fmt.Errorf("failed to save media item record: %w", err)
		}
	} else if err != nil {
		return fmt.Errorf("failed to check existing media item: %w", err)
	} else {
		// Update existing MediaItem
		query := `
			UPDATE "MediaItem" SET
				"fileSize" = $1,
				"fileModifiedAt" = $2,
				"updatedAt" = datetime('now'),
				"episodeId" = $3,
				duration = $4
			WHERE "filePath" = $5
		`
		_, err = d.db.Exec(query, info.FileSize, info.MTime, episodeId, durationMinutes, filePath)
		if err != nil {
			return fmt.Errorf("failed to update media item record: %w", err)
		}
	}

	info.ID = tvShowId // Return the TVShow ID for metadata processing

	// 7. Link to library
	if libraryId != "" && tvShowId != "" {
		linkQuery := `
			INSERT INTO "_LibraryToTVShow" ("A", "B")
			VALUES ($1, $2)
			ON CONFLICT DO NOTHING
		`
		_, err := d.db.Exec(linkQuery, libraryId, tvShowId)
		if err != nil {
			fmt.Printf("Warning: failed to link TV show to library: %v\n", err)
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
		// SQLite doesn't support ANY() or arrays, so we build a query with IN clause
		// For large arrays, we might need to batch, but for now use a simple approach
		placeholders := make([]string, len(foundFilePaths))
		args := make([]interface{}, len(foundFilePaths)+2)
		args[0] = pathPattern
		args[1] = exactPattern
		for i, path := range foundFilePaths {
			placeholders[i] = fmt.Sprintf("$%d", i+3)
			args[i+2] = path
		}
		
		query := fmt.Sprintf(`
			DELETE FROM "MediaItem"
			WHERE ("filePath" LIKE $1 OR "filePath" = $2)
			AND "filePath" NOT IN (%s)
		`, strings.Join(placeholders, ", "))
		
		res, err := tx.Exec(query, args...)
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
			SET status = $1,
				"startedAt" = COALESCE("startedAt", datetime('now')),
				"updatedAt" = datetime('now')
			WHERE id = $2
		`
	} else if status == "COMPLETED" {
		query = `
			UPDATE "ScanJob" 
			SET status = $1,
				"completedAt" = datetime('now'),
				"updatedAt" = datetime('now')
			WHERE id = $2
		`
	} else if status == "FAILED" {
		query = `
			UPDATE "ScanJob" 
			SET status = $1,
				"completedAt" = datetime('now'),
				"updatedAt" = datetime('now')
			WHERE id = $2
		`
	} else {
		query = `
			UPDATE "ScanJob" 
			SET status = $1,
				"updatedAt" = datetime('now')
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
			"updatedAt" = datetime('now')
		WHERE id = $1
	`, scanJobId)
	if err != nil {
		return fmt.Errorf("failed to increment scan job scanned count: %w", err)
	}
	return nil
}

