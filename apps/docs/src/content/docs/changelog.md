---
title: Changelog
description: All notable changes to DesterLib
---

All notable changes to DesterLib will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

#### API Server

- **Version Management**
  - Version matching system between API and clients
  - Automatic version validation middleware
  - Client version compatibility checking with strict semantic versioning
  - Version information in health endpoint
  - API version exposed via response headers (`X-API-Version`)
  - Version mismatch error handling (HTTP 426)

- **Media Scanning**
  - Batch scanning with job tracking and resume capability
  - Scan job status tracking in database (PENDING, IN_PROGRESS, COMPLETED, FAILED, PAUSED)
  - Progress tracking with batch processing
  - Folder-level batch processing for large libraries
  - Scan job cleanup and management
  - Improved file detection with configurable regex patterns
  - Media type detection (movies, TV shows, music, comics)
  - Path validation and sanitization
  - Rate limiting for TMDB API calls
  - Timeout handling for long-running scans

- **Color Extraction & Mesh Gradients**
  - Automatic color extraction from media posters/backdrops
  - Mesh gradient generation with 4-corner color mapping
  - Color caching in database for performance
  - On-demand color extraction middleware
  - Background color extraction for non-blocking requests
  - Darkened color variants for better UI contrast

- **Logging & Monitoring**
  - Real-time logs streaming with WebSocket support
  - REST endpoints for log retrieval
  - Log filtering by level (error, warn, info, debug)
  - Log file parsing and structured log entries
  - Log clearing functionality

- **Search & Discovery**
  - Search functionality for movies and TV shows
  - Genre-based filtering
  - Library search capabilities

- **Database Schema**
  - Mesh gradient colors stored in Media model
  - Scan job tracking with progress fields
  - Enhanced library management with hierarchical support
  - External ID tracking (TMDB, IMDB, TVDB, etc.)
  - Person and role tracking (actors, directors, writers)
  - Genre management with slug support

- **API Improvements**
  - Unified response structure across all endpoints
  - Enhanced Swagger/OpenAPI documentation
  - Improved error handling and validation
  - Input sanitization middleware

#### CLI Tool (`@desterlib/cli`)

- **Setup Wizard**
  - Interactive setup wizard for Docker configuration
  - Docker installation check and validation
  - Docker Compose availability verification
  - Installation directory management (`~/.desterlib`)
  - Existing installation detection and reconfiguration options

- **Configuration Generation**
  - Automatic Docker Compose file generation
  - Environment file (.env) generation with secure defaults
  - README generation with management commands
  - Custom port configuration
  - Database credentials setup
  - Media path configuration with validation

- **Features**
  - Update checker for CLI tool
  - Banner display on startup
  - Path validation and sanitization
  - Container status checking
  - Docker container management commands

#### Flutter Client

- **Core Features**
  - Cross-platform support (Android, iOS, macOS, Linux, Windows)
  - Media library browsing (movies and TV shows)
  - Video streaming with smooth playback
  - Watch progress tracking and resume functionality
  - Search and filter capabilities
  - Dark mode support
  - Server configuration management
  - Version compatibility checking

- **Video Player**
  - Full-featured video player with controls
  - Playback speed adjustment
  - Progress tracking and seeking
  - Volume control
  - Fullscreen support
  - Gesture controls
  - Video settings menu
  - Track selection (audio/subtitle support)

- **Library Management**
  - Library browsing with grid/list views
  - Genre-based filtering and color coding
  - Media detail pages with metadata
  - TV show seasons and episodes navigation
  - Library search functionality
  - Media search across libraries

- **Settings & Configuration**
  - Server connection management
  - Library management (add, edit, delete)
  - TMDB API key configuration
  - Video player settings
  - API connection testing

- **Logs Viewer**
  - Real-time log streaming
  - Log filtering by level
  - Log modal viewer
  - Structured log display

#### Documentation

- **New Documentation Site**
  - Astro-based documentation site with Starlight theme
  - Responsive design with mobile/tablet/desktop mockups
  - Interactive API documentation
  - Getting started guides
  - Platform-specific setup guides
  - Deployment guides
  - Development guides

- **Documentation Sections**
  - API overview and environment variables
  - CLI tool documentation
  - Client platform setup guides
  - Deployment guides (Docker, security)
  - Development guides (contributing, versioning, structure)
  - User guides (TMDB setup, backup/restore, remote access, updating)
  - Changelog page integrated into docs

### Changed

- Improved scanning performance with batch processing
- Enhanced error handling and logging throughout API
- Better structured API responses with consistent format
- Improved Prisma query logging
- Optimized media scanning regex patterns
- Modularized scan helpers for better maintainability
- Enhanced middleware setup and organization

### Fixed

- Improved Prisma client location handling
- Better error messages for version mismatches
- Fixed scanning regex for better file detection
- Improved path validation and sanitization

## [0.1.0] - 2025-11-13

### Added

- Initial release
- Express API with TypeScript
- Flutter client application
- Media library management
- Movie and TV show catalog
- Media scanning and metadata fetching
- TMDB integration
- Media streaming endpoints
- WebSocket support for real-time updates
- Docker support
- Documentation site

### Features

- Library creation and management
- Media scanning with metadata extraction
- Search functionality for movies and TV shows
- Stream media files
- Settings management
- Color extraction from media posters
- Mesh gradient generation

### Security

- Rate limiting
- CORS configuration
- Input sanitization
- Helmet security headers

[Unreleased]: https://github.com/yourusername/desterlib/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/yourusername/desterlib/releases/tag/v0.1.0

