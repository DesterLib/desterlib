package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/dester/go-service/models"
	"github.com/dester/go-service/services/scanner"
	"github.com/sirupsen/logrus"
)

// ScanHandler handles POST /scan requests
func ScanHandler(scannerService *scanner.Service, logger *logrus.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.ScanRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			logger.WithError(err).Error("Failed to decode scan request")
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if req.RootPath == "" {
			http.Error(w, "root_path is required", http.StatusBadRequest)
			return
		}

		// Normalize media type
		mediaType := strings.ToUpper(req.MediaType)
		if mediaType == "" {
			mediaType = "MOVIE"
		}

		// Start scanning in goroutine
		go scannerService.ScanDirectory(
			req.RootPath,
			req.LibraryID,
			mediaType,
			req.MaxDepth,
			req.ScanJobID,
			req.Rescan,
			req.FollowSymlinks,
		)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(models.ScanResponse{
			JobID:      fmt.Sprintf("scan-%d", time.Now().Unix()),
			TotalFiles: 0,
			Message:    "Scan started",
		})
	}
}

// HealthHandler handles GET /health requests
func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("ok"))
}

