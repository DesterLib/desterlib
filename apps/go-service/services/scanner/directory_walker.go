package scanner

import (
	"os"
	"path/filepath"
	"strings"
)

// walkDirectory recursively walks a directory and sends video files to the channel
func (s *Service) walkDirectory(rootPath string, maxDepth, currentDepth int, followSymlinks bool, fileChan chan<- string) {
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

