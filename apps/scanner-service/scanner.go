package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

type ScannerService struct {
	db      *Database
	redis   *RedisClient // Can be nil if Redis is unavailable
	logger  *logrus.Logger
	config  *Config
	ffprobe *FFProbe
}

func NewScannerService(db *Database, redis *RedisClient, logger *logrus.Logger, config *Config) *ScannerService {
	return &ScannerService{
		db:      db,
		redis:   redis,
		logger:  logger,
		config:  config,
		ffprobe: NewFFProbe(config.FFProbePath, config.FFProbeTimeout, logger),
	}
}

// ScanHandler handles POST /scan requests
func (s *ScannerService) ScanHandler(w http.ResponseWriter, r *http.Request) {
	var req ScanRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		s.logger.WithError(err).Error("Failed to decode scan request")
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.RootPath == "" {
		http.Error(w, "root_path is required", http.StatusBadRequest)
		return
	}

	maxDepth := req.MaxDepth
	if maxDepth == 0 {
		maxDepth = s.config.MaxScanDepth
	}

	// Normalize media type
	mediaType := strings.ToUpper(req.MediaType)
	if mediaType == "" {
		mediaType = "MOVIE"
	}

	// Start scanning in goroutine (pass scanJobId, rescan flag, and followSymlinks if provided)
	go s.scanDirectory(req.RootPath, req.LibraryID, mediaType, maxDepth, req.ScanJobID, req.Rescan, req.FollowSymlinks)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ScanResponse{
		JobID:      fmt.Sprintf("scan-%d", time.Now().Unix()),
		TotalFiles: 0,
		Message:    "Scan started",
	})
}

func (s *ScannerService) scanDirectory(rootPath, libraryId, mediaType string, maxDepth int, scanJobId string, rescan bool, followSymlinks bool) {
	// Handle panics and mark scan job as FAILED if something goes wrong
	defer func() {
		if r := recover(); r != nil {
			s.logger.WithFields(logrus.Fields{
				"error":       r,
				"scan_job_id": scanJobId,
			}).Error("Panic during scan, marking scan job as FAILED")
			if scanJobId != "" {
				s.db.UpdateScanJobStatus(scanJobId, "FAILED")
			}
		}
	}()

	s.logger.WithFields(logrus.Fields{
		"root_path":       rootPath,
		"library_id":      libraryId,
		"media_type":      mediaType,
		"max_depth":       maxDepth,
		"scan_job_id":     scanJobId,
		"follow_symlinks": followSymlinks,
	}).Info("Starting directory scan")

	// Update scan job status to IN_PROGRESS if scanJobId is provided
	if scanJobId != "" {
		if err := s.db.UpdateScanJobStatus(scanJobId, "IN_PROGRESS"); err != nil {
			s.logger.WithError(err).WithField("scan_job_id", scanJobId).Warn("Failed to update scan job status to IN_PROGRESS")
		}
	}

	// Channel for discovered files
	fileChan := make(chan string, 1000)
	var wg sync.WaitGroup
	var totalFiles int
	var mu sync.Mutex

	// Start directory walker
	wg.Add(1)
	go func() {
		defer wg.Done()
		defer close(fileChan)
		s.walkDirectory(rootPath, maxDepth, 0, followSymlinks, fileChan)
	}()

	// Process files with worker pool
	results := make(chan *MovieInfo, 100)
	errors := make(chan error, 100)
	
	// Done channel for results processor
	doneChan := make(chan struct{})

	// Start workers
	for i := 0; i < s.config.WorkerCount; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for filePath := range fileChan {
				mu.Lock()
				totalFiles++
				mu.Unlock()

				// Pass mediaType to processFile if needed for logic decision
				movie, err := s.processFile(filePath, rootPath)
				if err != nil {
					s.logger.WithError(err).WithField("file", filePath).Warn("Failed to process file")
					errors <- err
					// Don't increment scannedCount for invalid/failed files
					// scannedCount should only track valid media files that will get metadata jobs
					continue
				}

				// Only send validated movies to results channel
				// processFile validates the file is a video (checks extension) and extracts info
				// If movie != nil, it passed validation and will be saved and get metadata
				if movie != nil {
					results <- movie
				}
			}
		}()
	}

	// Collect results and save to database
	go func() {
		defer close(doneChan)
		var foundMediaIds []string
		var foundFilePaths []string

		for movie := range results {
			// All items in results channel are already validated as valid movies
			// (processFile checks video extensions and file validity)
			// If saved successfully, they should automatically get metadata jobs
			
			if err := s.db.SaveMedia(movie, libraryId, mediaType); err != nil {
				s.logger.WithError(err).WithField("movie", movie.Filename).Error("Failed to save media")
				// Don't increment scannedCount if save failed - invalid or duplicate
				continue
			}
			
			// Collect ID for cleanup
			if movie.ID != "" {
				foundMediaIds = append(foundMediaIds, movie.ID)
			}
			// Collect full path for movie file cleanup (if it's a file-based media)
			fullPath := filepath.Join(rootPath, movie.FolderPath, movie.Filename)
			foundFilePaths = append(foundFilePaths, fullPath)

			// Automatically queue metadata job for this validated and saved movie
			// Every successfully saved movie should get metadata fetched
			if s.redis != nil {
				job := &MetadataJob{
					MediaID:    movie.ID,
					MediaType:  mediaType, // Pass mediaType to MetadataJob
					Title:      movie.Title,
					Year:       movie.Year,
					FolderPath: movie.FolderPath,
					Filename:   movie.Filename,
					LibraryID:  libraryId,
					Rescan:     rescan, // Pass rescan flag to force metadata re-fetch
				}

				if err := s.redis.PushMetadataJob(s.config.ScanQueueName, job); err != nil {
					// Log warning but continue - file was saved and should still be counted
					// Metadata can be fetched later manually or when Redis is available
					s.logger.WithError(err).WithField("media_id", movie.ID).Warn("Failed to push metadata job to queue (Redis may be unavailable). File saved but metadata will need to be fetched later.")
				} else {
					s.logger.WithFields(logrus.Fields{
						"media_id": movie.ID,
						"title":    movie.Title,
					}).Debug("Media processed and queued for metadata")
				}
			} else {
				// Redis is not available, but movie was saved to database
				// Metadata can be fetched later when Redis is available
				s.logger.WithFields(logrus.Fields{
					"media_id": movie.ID,
					"title":    movie.Title,
				}).Debug("Media processed and saved to database (Redis unavailable for metadata queue)")
			}

			// Increment scannedCount for every validated and successfully saved movie
			// scannedCount = number of valid movies that were saved and should get metadata
			// This ensures scannedCount matches metadataSuccessCount + metadataFailedCount when complete
			if scanJobId != "" {
				if err := s.db.IncrementScanJobScannedCount(scanJobId); err != nil {
					s.logger.WithError(err).WithField("scan_job_id", scanJobId).Debug("Failed to increment scan job scanned count (non-critical)")
				}
			}
		}
		
		// Cleanup phase
		if libraryId != "" {
			removedLinks, deletedOrphans, err := s.db.CleanupLibrary(libraryId, foundMediaIds, foundFilePaths, rootPath)
			if err != nil {
				s.logger.WithError(err).Error("Failed to cleanup library")
			} else {
				if removedLinks > 0 || deletedOrphans > 0 {
					s.logger.WithFields(logrus.Fields{
						"library_id": libraryId,
						"removed_links": removedLinks,
						"deleted_orphans": deletedOrphans,
					}).Info("Library cleanup completed")
				}
			}
		}
	}()

	// Wait for all workers to complete
	wg.Wait()
	close(results)
	close(errors)
	
	// Wait for DB processing and cleanup to finish
	<-doneChan

	s.logger.WithField("total_files", totalFiles).Info("Directory scan completed")

	// Update scan job status to COMPLETED if scanJobId is provided
	if scanJobId != "" {
		if err := s.db.UpdateScanJobStatus(scanJobId, "COMPLETED"); err != nil {
			s.logger.WithError(err).WithField("scan_job_id", scanJobId).Warn("Failed to update scan job status to COMPLETED")
		} else {
			s.logger.WithFields(logrus.Fields{
				"scan_job_id": scanJobId,
				"total_files": totalFiles,
			}).Info("Scan job marked as COMPLETED")
		}
	}
}

func (s *ScannerService) walkDirectory(rootPath string, maxDepth, currentDepth int, followSymlinks bool, fileChan chan<- string) {
	if currentDepth > maxDepth {
		return
	}

	entries, err := os.ReadDir(rootPath)
	if err != nil {
		s.logger.WithError(err).WithField("path", rootPath).Warn("Failed to read directory")
		return
	}

	for _, entry := range entries {
		fullPath := filepath.Join(rootPath, entry.Name())

		// Check if entry is a symlink
		fileInfo, err := os.Lstat(fullPath)
		if err != nil {
			s.logger.WithError(err).WithField("path", fullPath).Warn("Failed to get file info")
			continue
		}

		isSymlink := fileInfo.Mode()&os.ModeSymlink != 0

		// Skip symlinks if followSymlinks is false
		if isSymlink && !followSymlinks {
			s.logger.WithField("path", fullPath).Debug("Skipping symbolic link (followSymlinks=false)")
			continue
		}

		// For symlinks when followSymlinks is true, resolve the target
		if isSymlink && followSymlinks {
			// Resolve symlink to get actual target info
			targetPath, err := filepath.EvalSymlinks(fullPath)
			if err != nil {
				s.logger.WithError(err).WithField("path", fullPath).Warn("Failed to resolve symbolic link")
				continue
			}

			targetInfo, err := os.Stat(targetPath)
			if err != nil {
				s.logger.WithError(err).WithField("path", targetPath).Warn("Failed to stat symlink target")
				continue
			}

			// Process based on target type
			if targetInfo.IsDir() {
				s.walkDirectory(targetPath, maxDepth, currentDepth+1, followSymlinks, fileChan)
			} else {
				// Check if file has video extension
				ext := strings.ToLower(filepath.Ext(entry.Name()))
				for _, videoExt := range s.config.VideoExtensions {
					if ext == strings.ToLower(videoExt) {
						fileChan <- targetPath
						break
					}
				}
			}
			continue
		}

		// Handle normal files and directories
		if entry.IsDir() {
			s.walkDirectory(fullPath, maxDepth, currentDepth+1, followSymlinks, fileChan)
		} else {
			// Check if file has video extension
			ext := strings.ToLower(filepath.Ext(entry.Name()))
			for _, videoExt := range s.config.VideoExtensions {
				if ext == strings.ToLower(videoExt) {
					fileChan <- fullPath
					break
				}
			}
		}
	}
}

func (s *ScannerService) processFile(filePath, rootPath string) (*MovieInfo, error) {
	// Get file info
	info, err := os.Stat(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to stat file: %w", err)
	}

	// Extract title and year from filename/path
	dir := filepath.Dir(filePath)
	filename := filepath.Base(filePath)
	title, year := extractTitleAndYear(filename, dir)

	// Extract metadata using ffprobe
	// Note: On slow mounts (rclone), ffprobe may timeout or fail with buffer errors
	// This is expected and we continue with empty metadata
	metadata, err := s.ffprobe.Probe(filePath)
	if err != nil {
		// Log but don't fail - continue with empty metadata for slow mounts
		errMsg := err.Error()
		if strings.Contains(errMsg, "timeout") || strings.Contains(errMsg, "buffer") || strings.Contains(errMsg, "slow mount") {
			s.logger.WithFields(logrus.Fields{
				"file":  filePath,
				"error": err.Error(),
			}).Debug("ffprobe failed on slow mount - continuing without metadata")
		} else {
			s.logger.WithError(err).WithField("file", filePath).Warn("Failed to probe file, using defaults")
		}
		metadata = &FFProbeMetadata{} // Use empty metadata
	}

	// Calculate relative folder path
	relPath, _ := filepath.Rel(rootPath, dir)

	movie := &MovieInfo{
		Title:      title,
		Year:       year,
		FolderPath: relPath,
		Filename:   filename,
		VideoCodec: metadata.VideoCodec,
		AudioCodec: metadata.AudioCodec,
		Resolution: metadata.Resolution,
		Duration:   metadata.Duration,
		FileSize:   info.Size(),
		MTime:      info.ModTime(),
		MetadataStatus: "pending",
	}

	return movie, nil
}

var yearRegex = regexp.MustCompile(`(?:\b|\()((?:19|20)\d{2})(?:\b|\))`)

// extractTitleAndYear extracts title and year from filename or folder name
func extractTitleAndYear(filename, dir string) (string, *int) {
	// Remove extension
	name := strings.TrimSuffix(filename, filepath.Ext(filename))

	// Replace dots and underscores with spaces
	cleanName := strings.ReplaceAll(name, ".", " ")
	cleanName = strings.ReplaceAll(cleanName, "_", " ")

	// Find year
	var year *int
	matches := yearRegex.FindAllStringSubmatchIndex(cleanName, -1)

	var title string

	if len(matches) > 0 {
		// Use the last year found, as sometimes titles have dates in them (less common but possible)
		// Or better: use the first year found that looks like a release year (after title)
		// Usually, the first 4-digit number starting with 19/20 is the year.
		match := matches[0]
		yearVal := parseInt(cleanName[match[2]:match[3]])
		if yearVal != nil {
			year = yearVal
			// Title is everything before the year
			title = strings.TrimSpace(cleanName[:match[0]])

			// If title ends with '(', trim it
			title = strings.TrimSuffix(title, "(")
			title = strings.TrimSpace(title)
		}
	}

	// If no year found in filename, try folder name
	if year == nil {
		folderName := filepath.Base(dir)
		folderMatches := yearRegex.FindAllStringSubmatch(folderName, -1)
		if len(folderMatches) > 0 {
			// Take the last match from folder name usually? or first?
			// usually "Movie Title (Year)"
			yStr := folderMatches[len(folderMatches)-1][1]
			if y := parseInt(yStr); y != nil {
				year = y
			}
		}
	}

	// If we still don't have a title (because year wasn't found in filename), use the cleaned filename
	if title == "" {
		title = cleanName
	}

	// Clean title further - remove common release group tags if present
	// This is more aggressive cleaning
	title = cleanTitleString(title)

	return title, year
}

func cleanTitleString(title string) string {
	// List of common junk to remove if they appear in the title part
	// (though usually they appear after the year, so this is for cases where year wasn't found or was at end)

	// Simple logic: if we have "1080p" etc in title, cut it off
	junkMarkers := []string{
		"1080p", "720p", "480p", "2160p", "4k",
		"bluray", "webrip", "web-dl", "hdtv",
		"x264", "x265", "hevc", "h.264", "h.265",
		"aac", "ac3", "dts", "truehd", "ddp", "dd5.1",
		"repack", "proper", "remastered", "extended", "director's cut", "directors cut",
		"multi", "dual",
	}

	lowerTitle := strings.ToLower(title)
	shortestIdx := len(title)

	for _, marker := range junkMarkers {
		idx := strings.Index(lowerTitle, marker)
		if idx != -1 && idx < shortestIdx {
			shortestIdx = idx
		}
	}

	if shortestIdx < len(title) {
		title = title[:shortestIdx]
	}

	// Remove trailing punctuation
	title = strings.TrimRight(title, " -.,[]()")
	return strings.TrimSpace(title)
}

func parseInt(s string) *int {
	var result int
	if _, err := fmt.Sscanf(s, "%d", &result); err == nil {
		if result >= 1900 && result <= 2100 {
			return &result
		}
	}
	return nil
}
