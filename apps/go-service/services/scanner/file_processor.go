package scanner

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/dester/go-service/internal/ffprobe"
	"github.com/dester/go-service/models"
	"github.com/sirupsen/logrus"
)

var yearRegex = regexp.MustCompile(`(?:\b|\()((?:19|20)\d{2})(?:\b|\))`)
// TV show episode patterns: S01E01, s01e01, 1x01, 1x1, S1E1, etc.
var tvShowPattern = regexp.MustCompile(`(?i)(?:s|season)[\s._-]*(\d+)[\s._-]*(?:e|ep|episode)[\s._-]*(\d+)`)
var tvShowPatternAlt = regexp.MustCompile(`(\d+)[xX](\d+)`)
// Season folder pattern: "Season 1", "Season 01", "Season 02", etc.
var seasonFolderPattern = regexp.MustCompile(`(?i)season[\s._-]*(\d+)`)

// processFile processes a single file and extracts metadata
func (s *Service) processFile(filePath, rootPath string) (*models.MovieInfo, error) {
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
		metadata = &ffprobe.Metadata{} // Use empty metadata
	}

	// Calculate relative folder path
	relPath, _ := filepath.Rel(rootPath, dir)

	movie := &models.MovieInfo{
		Title:          title,
		Year:           year,
		FolderPath:     relPath,
		Filename:       filename,
		VideoCodec:     metadata.VideoCodec,
		AudioCodec:     metadata.AudioCodec,
		Resolution:     metadata.Resolution,
		Duration:       metadata.Duration,
		FileSize:       info.Size(),
		MTime:          info.ModTime(),
		MetadataStatus: "pending",
	}

	return movie, nil
}

// processTVShowFile processes a single TV show episode file and extracts metadata
func (s *Service) processTVShowFile(filePath, rootPath string) (*models.TVShowInfo, error) {
	// Get file info
	info, err := os.Stat(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to stat file: %w", err)
	}

	// Extract show title, season, and episode from filename/path
	dir := filepath.Dir(filePath)
	filename := filepath.Base(filePath)
	title, year, seasonNum, episodeNum := extractTVShowInfo(filename, dir)

	// If we couldn't extract season/episode, this might not be a TV show file
	if seasonNum == 0 || episodeNum == 0 {
		return nil, nil
	}

	// Extract metadata using ffprobe
	metadata, err := s.ffprobe.Probe(filePath)
	if err != nil {
		errMsg := err.Error()
		if strings.Contains(errMsg, "timeout") || strings.Contains(errMsg, "buffer") || strings.Contains(errMsg, "slow mount") {
			s.logger.WithFields(logrus.Fields{
				"file":  filePath,
				"error": err.Error(),
			}).Debug("ffprobe failed on slow mount - continuing without metadata")
		} else {
			s.logger.WithError(err).WithField("file", filePath).Warn("Failed to probe file, using defaults")
		}
		metadata = &ffprobe.Metadata{} // Use empty metadata
	}

	// Calculate relative folder path
	relPath, _ := filepath.Rel(rootPath, dir)

	tvShow := &models.TVShowInfo{
		Title:          title,
		Year:           year,
		SeasonNumber:   seasonNum,
		EpisodeNumber:  episodeNum,
		FolderPath:     relPath,
		Filename:       filename,
		VideoCodec:     metadata.VideoCodec,
		AudioCodec:     metadata.AudioCodec,
		Resolution:     metadata.Resolution,
		Duration:       metadata.Duration,
		FileSize:       info.Size(),
		MTime:          info.ModTime(),
		MetadataStatus: "pending",
	}

	return tvShow, nil
}

// extractTVShowInfo extracts show title, year, season, and episode from filename or folder name
func extractTVShowInfo(filename, dir string) (string, *int, int, int) {
	// Remove extension
	name := strings.TrimSuffix(filename, filepath.Ext(filename))

	// Try to find season/episode pattern in filename
	var seasonNum, episodeNum int
	var title string
	var year *int

	// Try S01E01 or s01e01 pattern first
	matches := tvShowPattern.FindStringSubmatch(name)
	if len(matches) >= 3 {
		seasonNum = parseIntValue(matches[1])
		episodeNum = parseIntValue(matches[2])
		// Title is everything before the pattern
		title = strings.TrimSpace(name[:strings.Index(name, matches[0])])
	} else {
		// Try 1x01 pattern
		matches = tvShowPatternAlt.FindStringSubmatch(name)
		if len(matches) >= 3 {
			seasonNum = parseIntValue(matches[1])
			episodeNum = parseIntValue(matches[2])
			// Title is everything before the pattern
			title = strings.TrimSpace(name[:strings.Index(name, matches[0])])
		}
	}

	// If no pattern found in filename, try folder name for season/episode
	if seasonNum == 0 || episodeNum == 0 {
		folderName := filepath.Base(dir)
		// Try S01E01 pattern in folder name
		matches = tvShowPattern.FindStringSubmatch(folderName)
		if len(matches) >= 3 {
			seasonNum = parseIntValue(matches[1])
			episodeNum = parseIntValue(matches[2])
		} else {
			// Try 1x01 pattern in folder name
			matches = tvShowPatternAlt.FindStringSubmatch(folderName)
			if len(matches) >= 3 {
				seasonNum = parseIntValue(matches[1])
				episodeNum = parseIntValue(matches[2])
			}
		}
	}

	// If we have season/episode from filename but no title, or if we need to get season from folder
	// Check for "Season 1", "Season 01" folder names
	if episodeNum == 0 && seasonNum == 0 {
		folderName := filepath.Base(dir)
		seasonMatches := seasonFolderPattern.FindStringSubmatch(folderName)
		if len(seasonMatches) >= 2 {
			seasonNum = parseIntValue(seasonMatches[1])
			// Episode number must be in filename if we're in a season folder
			// Re-check filename for episode
			matches = tvShowPattern.FindStringSubmatch(name)
			if len(matches) >= 3 {
				episodeNum = parseIntValue(matches[2]) // Episode is second capture group
			} else {
				matches = tvShowPatternAlt.FindStringSubmatch(name)
				if len(matches) >= 3 {
					episodeNum = parseIntValue(matches[2]) // Episode is second capture group
				}
			}
		}
	} else if seasonNum > 0 && episodeNum == 0 {
		// We have season but no episode - check if we're in a "Season X" folder
		// and episode is just a number in filename
		folderName := filepath.Base(dir)
		if seasonFolderPattern.MatchString(folderName) {
			// Try to find episode number as standalone number or E01 pattern
			epMatches := regexp.MustCompile(`(?i)(?:e|ep|episode)[\s._-]*(\d+)`).FindStringSubmatch(name)
			if len(epMatches) >= 2 {
				episodeNum = parseIntValue(epMatches[1])
			}
		}
	}

	// If we still don't have a title, try to extract from folder structure
	// Common structures:
	// - Show Name (Year)/Season 1/episode.mkv
	// - Show Name/Season 1/episode.mkv
	// - Show Name/episode.mkv (no season folder)
	// - Show Name S01E01/episode.mkv
	if title == "" {
		folderName := filepath.Base(dir)
		parentDir := filepath.Dir(dir)
		parentName := filepath.Base(parentDir)
		
		// If current folder is a "Season X" folder, show name is in parent
		if seasonFolderPattern.MatchString(folderName) {
			title = parentName
		} else if tvShowPattern.MatchString(folderName) || tvShowPatternAlt.MatchString(folderName) {
			// Current folder has season/episode pattern, try parent
			if !tvShowPattern.MatchString(parentName) && !tvShowPatternAlt.MatchString(parentName) && !seasonFolderPattern.MatchString(parentName) {
				title = parentName
			} else {
				// Try grandparent
				grandparentDir := filepath.Dir(parentDir)
				grandparentName := filepath.Base(grandparentDir)
				if !tvShowPattern.MatchString(grandparentName) && !tvShowPatternAlt.MatchString(grandparentName) && !seasonFolderPattern.MatchString(grandparentName) {
					title = grandparentName
				}
			}
		} else {
			// Current folder doesn't have pattern, it might be the show folder
			// Check if parent has season/episode or is a season folder
			if seasonFolderPattern.MatchString(parentName) || tvShowPattern.MatchString(parentName) || tvShowPatternAlt.MatchString(parentName) {
				// Parent is season folder or has pattern, try grandparent
				grandparentDir := filepath.Dir(parentDir)
				grandparentName := filepath.Base(grandparentDir)
				if !tvShowPattern.MatchString(grandparentName) && !tvShowPatternAlt.MatchString(grandparentName) && !seasonFolderPattern.MatchString(grandparentName) {
					title = grandparentName
				}
			} else {
				// Parent might be the show folder
				title = parentName
			}
		}
	}

	// If still no title, use cleaned filename (without season/episode part)
	if title == "" {
		// Remove season/episode pattern from name to get title
		title = tvShowPattern.ReplaceAllString(name, "")
		title = tvShowPatternAlt.ReplaceAllString(title, "")
		title = strings.TrimSpace(title)
		if title == "" {
			title = name
		}
	}

	// Extract year from title or folder
	if title != "" {
		yearMatches := yearRegex.FindAllStringSubmatchIndex(title, -1)
		if len(yearMatches) > 0 {
			match := yearMatches[0]
			yearVal := parseInt(title[match[2]:match[3]])
			if yearVal != nil {
				year = yearVal
				title = strings.TrimSpace(title[:match[0]])
				title = strings.TrimSuffix(title, "(")
				title = strings.TrimSpace(title)
			}
		}
	}

	// If no year found, try folder name
	if year == nil {
		folderName := filepath.Base(dir)
		folderMatches := yearRegex.FindAllStringSubmatch(folderName, -1)
		if len(folderMatches) > 0 {
			yStr := folderMatches[len(folderMatches)-1][1]
			if y := parseInt(yStr); y != nil {
				year = y
			}
		}
	}

	// Clean title
	if title != "" {
		title = cleanTitleString(title)
	}

	return title, year, seasonNum, episodeNum
}

func parseIntValue(s string) int {
	var result int
	if _, err := fmt.Sscanf(s, "%d", &result); err == nil {
		return result
	}
	return 0
}

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
		// Use the first year found that looks like a release year
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
			// Take the last match from folder name
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
	title = cleanTitleString(title)

	return title, year
}

func cleanTitleString(title string) string {
	// List of common junk to remove if they appear in the title part
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

