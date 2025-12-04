package main

import "time"

// MovieInfo represents basic movie information from scanner
type MovieInfo struct {
	ID             string    `json:"id"`
	Title          string    `json:"title"`
	Year           *int      `json:"year,omitempty"`
	FolderPath     string    `json:"folder_path"`
	Filename       string    `json:"filename"`
	VideoCodec     string    `json:"video_codec,omitempty"`
	AudioCodec     string    `json:"audio_codec,omitempty"`
	Resolution     string    `json:"resolution,omitempty"`
	Duration       *int      `json:"duration,omitempty"` // in seconds
	FileSize       int64     `json:"file_size"`
	MTime          time.Time `json:"mtime"`
	MetadataStatus string    `json:"metadata_status"` // pending, processing, completed, failed
}

// ScanRequest represents a scan request
type ScanRequest struct {
	RootPath  string `json:"root_path"`
	MaxDepth  int    `json:"max_depth,omitempty"`
	LibraryID string `json:"library_id,omitempty"`
	MediaType string `json:"media_type,omitempty"` // MOVIE, TV_SHOW
	ScanJobID string `json:"scan_job_id,omitempty"` // Database scan job ID for tracking progress
	Rescan    bool   `json:"rescan,omitempty"`       // Force re-scan and re-fetch metadata
}

// ScanResponse represents a scan response
type ScanResponse struct {
	JobID      string `json:"job_id"`
	TotalFiles int    `json:"total_files"`
	Message    string `json:"message"`
}

// MetadataJob represents a job pushed to Redis queue
type MetadataJob struct {
	MediaID    string `json:"media_id"`
	MediaType  string `json:"media_type"` // Added to support split tables
	Title      string `json:"title"`
	Year       *int   `json:"year,omitempty"`
	FolderPath string `json:"folder_path"`
	Filename   string `json:"filename"`
	LibraryID  string `json:"library_id,omitempty"`
	Rescan     bool   `json:"rescan,omitempty"` // Force re-fetch metadata even if exists
}
