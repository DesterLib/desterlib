package scanner

import (
	"fmt"
	"path/filepath"
	"sync"

	"github.com/dester/go-service/config"
	"github.com/dester/go-service/internal/database"
	"github.com/dester/go-service/internal/ffprobe"
	"github.com/dester/go-service/internal/redis"
	"github.com/dester/go-service/models"
	"github.com/sirupsen/logrus"
)

// Service handles media scanning operations
type Service struct {
	db      *database.Database
	redis   *redis.Client
	logger  *logrus.Logger
	config  *config.Config
	ffprobe *ffprobe.FFProbe
}

// New creates a new scanner service
func New(db *database.Database, redisClient *redis.Client, logger *logrus.Logger, cfg *config.Config) *Service {
	return &Service{
		db:      db,
		redis:   redisClient,
		logger:  logger,
		config:  cfg,
		ffprobe: ffprobe.New(cfg.FFProbePath, cfg.FFProbeTimeout, logger),
	}
}

// ScanDirectory scans a directory for media files
func (s *Service) ScanDirectory(rootPath, libraryId, mediaType string, maxDepth int, scanJobId string, rescan bool, followSymlinks bool) {
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
	// Use interface{} to handle both MovieInfo and TVShowInfo
	results := make(chan interface{}, 100)
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

				if mediaType == "TV_SHOW" {
					tvShow, err := s.processTVShowFile(filePath, rootPath)
					if err != nil {
						s.logger.WithError(err).WithField("file", filePath).Warn("Failed to process TV show file")
						errors <- err
						continue
					}

					if tvShow != nil {
						results <- tvShow
					}
				} else {
					movie, err := s.processFile(filePath, rootPath)
					if err != nil {
						s.logger.WithError(err).WithField("file", filePath).Warn("Failed to process file")
						errors <- err
						continue
					}

					if movie != nil {
						results <- movie
					}
				}
			}
		}()
	}

	// Collect results and save to database
	go func() {
		defer close(doneChan)
		var foundMediaIds []string
		var foundFilePaths []string

		for result := range results {
			var mediaId string
			var title string
			var year *int
			var folderPath string
			var filename string

			// Handle both MovieInfo and TVShowInfo
			switch v := result.(type) {
			case *models.MovieInfo:
				if err := s.db.SaveMedia(v, libraryId, mediaType); err != nil {
					s.logger.WithError(err).WithField("movie", v.Filename).Error("Failed to save media")
					continue
				}
				mediaId = v.ID
				title = v.Title
				year = v.Year
				folderPath = v.FolderPath
				filename = v.Filename
			case *models.TVShowInfo:
				if err := s.db.SaveTVShow(v, libraryId, mediaType); err != nil {
					s.logger.WithError(err).WithField("tvshow", v.Filename).Error("Failed to save TV show")
					continue
				}
				mediaId = v.ID
				title = v.Title
				year = v.Year
				folderPath = v.FolderPath
				filename = v.Filename
			default:
				s.logger.WithField("type", fmt.Sprintf("%T", v)).Error("Unknown media type in results")
				continue
			}

			// Collect ID for cleanup
			if mediaId != "" {
				foundMediaIds = append(foundMediaIds, mediaId)
			}
			// Collect full path for file cleanup
			fullPath := filepath.Join(rootPath, folderPath, filename)
			foundFilePaths = append(foundFilePaths, fullPath)

			// Automatically queue metadata job for this validated and saved media
			if s.redis != nil {
				job := &models.MetadataJob{
					MediaID:    mediaId,
					MediaType:  mediaType,
					Title:      title,
					Year:       year,
					FolderPath: folderPath,
					Filename:   filename,
					LibraryID:  libraryId,
					Rescan:     rescan,
				}

				if err := s.redis.PushMetadataJob(s.config.ScanQueueName, job); err != nil {
					s.logger.WithError(err).WithField("media_id", mediaId).Warn("Failed to push metadata job to queue (Redis may be unavailable). File saved but metadata will need to be fetched later.")
				} else {
					s.logger.WithFields(logrus.Fields{
						"media_id": mediaId,
						"title":    title,
					}).Debug("Media processed and queued for metadata")
				}
			} else {
				s.logger.WithFields(logrus.Fields{
					"media_id": mediaId,
					"title":    title,
				}).Debug("Media processed and saved to database (Redis unavailable for metadata queue)")
			}

			// Increment scannedCount for every validated and successfully saved media
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
						"library_id":     libraryId,
						"removed_links":  removedLinks,
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

