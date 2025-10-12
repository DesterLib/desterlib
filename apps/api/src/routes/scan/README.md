# Scan API

Directory scanning functionality for media files, similar to Plex/Jellyfin.

## Architecture

This module follows a clean architecture pattern:

- **`scan.service.ts`** - Business logic for scanning directories, validating paths, and filtering files
- **`scan.controller.ts`** - Request handlers that orchestrate service calls and handle responses
- **`scan.module.ts`** - Express router that defines API endpoints

## Endpoints

### 1. Scan Directory

**POST** `/api/scan`

Scans a directory for media files based on the provided media type.

**Request Body:**
```json
{
  "path": "/path/to/media/folder",
  "mediaType": "MOVIE",
  "collectionName": "My Collection"  // Optional, defaults to folder name
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "abc123",
  "data": {
    "message": "Successfully scanned 15 MOVIE files",
    "scan": {
      "collectionName": "My Collection",
      "mediaType": "MOVIE",
      "scannedPath": "/path/to/media/folder",
      "totalFiles": 15,
      "files": [
        {
          "path": "/path/to/media/folder/Movie.mkv",
          "name": "Movie.mkv",
          "size": 1234567890,
          "extension": ".mkv",
          "relativePath": "Movie.mkv"
        }
      ],
      "timestamp": "2025-10-12T10:30:00.000Z"
    }
  }
}
```

### 2. Get Supported Extensions

**GET** `/api/scan/supported-extensions`

Returns supported file extensions for all media types or a specific type.

**Query Parameters:**
- `mediaType` (optional) - Filter by specific media type

**Response (all types):**
```json
{
  "success": true,
  "requestId": "abc123",
  "data": {
    "supportedExtensions": {
      "MOVIE": [".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v"],
      "TV_SHOW": [".mp4", ".mkv", ".avi", ".mov", ".wmv", ".flv", ".webm", ".m4v"],
      "MUSIC": [".mp3", ".flac", ".wav", ".aac", ".ogg", ".m4a", ".wma", ".opus"],
      "COMIC": [".cbr", ".cbz", ".cb7", ".cbt", ".pdf", ".epub"]
    }
  }
}
```

### 3. Get Media Types

**GET** `/api/scan/media-types`

Returns all supported media types.

**Response:**
```json
{
  "success": true,
  "requestId": "abc123",
  "data": {
    "mediaTypes": ["MOVIE", "TV_SHOW", "MUSIC", "COMIC"]
  }
}
```

## Supported Media Types

- **MOVIE** - Movies (`.mp4`, `.mkv`, `.avi`, `.mov`, etc.)
- **TV_SHOW** - TV Shows with season/episode detection
- **MUSIC** - Audio files (`.mp3`, `.flac`, `.wav`, etc.)
- **COMIC** - Comic books (`.cbr`, `.cbz`, `.pdf`, etc.)

## Features

✅ **Recursive Scanning** - Scans subdirectories automatically  
✅ **File Filtering** - Only includes supported extensions  
✅ **Error Handling** - Proper error responses using the response system  
✅ **Path Validation** - Validates directory exists and is accessible  
✅ **Hidden File Filtering** - Skips hidden files and system directories  
✅ **Relative Paths** - Provides both absolute and relative file paths  
✅ **File Metadata** - Includes size, extension, and name for each file  
✅ **TV Show Parsing** - Detects season/episode patterns (future enhancement)

## Example Usage

### Scan a Movies Directory

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/media/movies",
    "mediaType": "MOVIE"
  }'
```

### Scan with Custom Collection Name

```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "path": "/media/marvel",
    "mediaType": "MOVIE",
    "collectionName": "Marvel Cinematic Universe"
  }'
```

### Get Supported Extensions

```bash
curl http://localhost:3000/api/scan/supported-extensions?mediaType=MOVIE
```

## Error Handling

All errors are handled using the custom response system:

- **400 Bad Request** - Invalid input (missing path, invalid media type)
- **404 Not Found** - Path doesn't exist
- **403 Forbidden** - Permission denied
- **500 Internal Server Error** - Unexpected errors

## Future Enhancements

- [ ] TV Show metadata extraction (season/episode from filename)
- [ ] Duplicate file detection
- [ ] Thumbnail generation
- [ ] Integration with Prisma to save scanned files
- [ ] Background/async scanning for large directories
- [ ] Progress updates via WebSocket
- [ ] File hash generation for integrity checking

