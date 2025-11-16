# api

## 0.2.0

### Minor Changes

- [#10](https://github.com/DesterLib/desterlib/pull/10) [`ef7a9b6`](https://github.com/DesterLib/desterlib/commit/ef7a9b6cbfc1db2db89529199bc8501e9d5bdf8a) Thanks [@AlkenD](https://github.com/AlkenD)! - Add significant API improvements and new features

  **Version Management:**
  - Version matching system between API and clients
  - Automatic version validation middleware
  - Client version compatibility checking with strict semantic versioning
  - Version information in health endpoint
  - API version exposed via response headers (`X-API-Version`)
  - Version mismatch error handling (HTTP 426)

  **Media Scanning:**
  - Batch scanning with job tracking and resume capability
  - Scan job status tracking in database (PENDING, IN_PROGRESS, COMPLETED, FAILED, PAUSED)
  - Progress tracking with batch processing
  - Folder-level batch processing for large libraries
  - Improved file detection with configurable regex patterns
  - Media type detection (movies, TV shows, music, comics)
  - Path validation and sanitization
  - Rate limiting for TMDB API calls
  - Timeout handling for long-running scans

  **Color Extraction & Mesh Gradients:**
  - Automatic color extraction from media posters/backdrops
  - Mesh gradient generation with 4-corner color mapping
  - Color caching in database for performance
  - On-demand color extraction middleware
  - Background color extraction for non-blocking requests

  **Logging & Monitoring:**
  - Real-time logs streaming with WebSocket support
  - REST endpoints for log retrieval
  - Log filtering by level (error, warn, info, debug)
  - Log file parsing and structured log entries
  - Log clearing functionality

  **API Improvements:**
  - Unified response structure across all endpoints
  - Enhanced Swagger/OpenAPI documentation
  - Improved error handling and validation
  - Input sanitization middleware
