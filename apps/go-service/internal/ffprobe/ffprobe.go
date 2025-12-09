package ffprobe

import (
	"context"
	"encoding/json"
	"fmt"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// Metadata contains extracted video metadata
type Metadata struct {
	VideoCodec string `json:"video_codec"`
	AudioCodec string `json:"audio_codec"`
	Resolution string `json:"resolution"`
	Duration   *int   `json:"duration"` // in seconds
}

// FFProbe extracts metadata from video files
type FFProbe struct {
	path    string
	timeout time.Duration
	logger  *logrus.Logger
}

// New creates a new FFProbe instance
func New(path string, timeout time.Duration, logger *logrus.Logger) *FFProbe {
	return &FFProbe{
		path:    path,
		timeout: timeout,
		logger:  logger,
	}
}

// Probe extracts metadata from a video file using ffprobe
func (f *FFProbe) Probe(filePath string) (*Metadata, error) {
	// Create context with timeout for slow mounts (e.g., rclone)
	ctx, cancel := context.WithTimeout(context.Background(), f.timeout)
	defer cancel()

	// Use ffprobe to get video stream info
	// Added flags for better compatibility with slow mounts:
	// - probesize: limit initial probing (faster on slow mounts)
	// - analyze_duration: limit analysis duration
	// - read_intervals: allow partial reads for slow streams
	cmd := exec.CommandContext(
		ctx,
		f.path,
		"-v", "quiet",
		"-err_detect", "ignore_err", // Ignore errors to avoid "unable to fill buffer"
		"-probesize", "32M",          // Limit probe size for faster startup
		"-analyzeduration", "10M",    // Limit analysis duration
		"-print_format", "json",
		"-show_streams",
		"-show_format",
		filePath,
	)

	output, err := cmd.CombinedOutput() // Use CombinedOutput to capture stderr
	if err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			f.logger.WithFields(logrus.Fields{
				"file":    filePath,
				"timeout": f.timeout,
			}).Warn("ffprobe timeout - file may be on slow mount (rclone)")
			return nil, fmt.Errorf("ffprobe timeout after %v (file may be on slow mount): %w", f.timeout, err)
		}
		
		// Check for specific buffer fill errors from rclone mounts
		errStr := string(output)
		if strings.Contains(errStr, "unable to fill buffer") || strings.Contains(errStr, "Input/output error") {
			f.logger.WithFields(logrus.Fields{
				"file":  filePath,
				"error": "buffer fill error - likely slow rclone mount",
			}).Warn("ffprobe buffer error - skipping metadata extraction for slow mount")
			return nil, fmt.Errorf("ffprobe buffer error on slow mount: %w", err)
		}
		
		f.logger.WithFields(logrus.Fields{
			"file":   filePath,
			"error":  err,
			"output": errStr,
		}).Debug("ffprobe failed")
		return nil, fmt.Errorf("ffprobe failed: %w", err)
	}

	var probeOutput struct {
		Streams []struct {
			CodecType string `json:"codec_type"`
			CodecName string `json:"codec_name"`
			Width     int    `json:"width"`
			Height    int    `json:"height"`
		} `json:"streams"`
		Format struct {
			Duration string `json:"duration"`
		} `json:"format"`
	}

	if err := json.Unmarshal(output, &probeOutput); err != nil {
		return nil, fmt.Errorf("failed to parse ffprobe output: %w", err)
	}

	metadata := &Metadata{}

	// Extract video codec and resolution
	for _, stream := range probeOutput.Streams {
		if stream.CodecType == "video" {
			metadata.VideoCodec = stream.CodecName
			if stream.Width > 0 && stream.Height > 0 {
				metadata.Resolution = fmt.Sprintf("%dx%d", stream.Width, stream.Height)
			}
		} else if stream.CodecType == "audio" {
			metadata.AudioCodec = stream.CodecName
		}
	}

	// Extract duration
	if probeOutput.Format.Duration != "" {
		if duration, err := strconv.ParseFloat(probeOutput.Format.Duration, 64); err == nil {
			durationInt := int(duration)
			metadata.Duration = &durationInt
		}
	}

	return metadata, nil
}

