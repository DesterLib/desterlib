# Go Service - Modular Scanner Service

This is a refactored, modular version of the scanner service with a clean, easy-to-understand structure.

## Structure

```
go-service/
├── main.go                    # Application entry point
├── config/                     # Configuration management
│   └── config.go              # Loads config from environment
├── models/                     # Data models
│   └── models.go              # Request/response and data models
├── internal/                   # Internal packages (not exported)
│   ├── database/              # Database layer
│   │   └── database.go        # Database operations
│   ├── redis/                 # Redis client
│   │   └── redis.go           # Redis queue operations
│   └── ffprobe/               # FFProbe utilities
│       └── ffprobe.go         # Video metadata extraction
├── services/                   # Business logic services
│   └── scanner/               # Scanner service
│       ├── scanner.go         # Main scanning logic
│       ├── file_processor.go # File processing utilities
│       └── directory_walker.go # Directory traversal
└── handlers/                   # HTTP handlers
    └── scan.go                # HTTP request handlers
```

## Package Responsibilities

### `config`

- Loads configuration from environment variables
- Provides default values
- Validates required settings

### `models`

- Defines all data structures
- Request/response types
- Shared models across packages

### `internal/database`

- Database connection management
- Media saving operations
- Scan job status updates
- Library cleanup operations

### `internal/redis`

- Redis connection (graceful degradation if unavailable)
- Metadata job queue operations
- Connection health checking

### `internal/ffprobe`

- Video file metadata extraction
- Handles slow mounts (rclone) gracefully
- Timeout management

### `services/scanner`

- Main scanning orchestration
- File processing pipeline
- Directory traversal
- Worker pool management

### `handlers`

- HTTP request handling
- Request validation
- Response formatting

## Benefits of This Structure

1. **Separation of Concerns**: Each package has a single, clear responsibility
2. **Easy to Test**: Packages can be tested independently
3. **Easy to Understand**: Clear package boundaries and naming
4. **Easy to Extend**: New features can be added to appropriate packages
5. **Internal Packages**: `internal/` prevents external imports of implementation details
6. **Modular**: Services can be reused or replaced independently

## Migration from scanner-service

The old `scanner-service` has been refactored into this modular structure:

- All functionality preserved
- Better code organization
- Improved maintainability
- Same API endpoints (`/scan`, `/health`)

## Building

### Build for Current Platform

```bash
# Builds to ../../dist/go-service/{platform}/
pnpm build
# or
./scripts/build.sh
```

### Build for All Platforms

```bash
# Builds binaries for all supported platforms
pnpm build:all
# or
./scripts/build.sh all
```

### Build Locally (for development)

```bash
# Builds to current directory
pnpm build:local
# or
go build -o go-service .
```

## Usage

### Using Built Binary

```bash
# Build first (creates dist/go-service/{platform}/)
pnpm build

# Then run from dist directory
../../dist/go-service/darwin-arm64/go-service

# Or with environment variables
DATABASE_URL=file:/path/to/database.db REDIS_URL=redis://... ../../dist/go-service/darwin-arm64/go-service
```

**Note:** The `dist/` directory is generated locally for testing and is not committed to git. Production binaries are built by GitHub Actions workflows.

### Development Mode

```bash
# Run directly without building
pnpm dev
# or
go run .
```

## Environment Variables

- `DATABASE_URL` - SQLite database file path or file: URL (required, e.g., `file:/path/to/database.db` or `/path/to/database.db`)
- `REDIS_URL` - Redis connection string (optional, defaults to `redis://localhost:6379/0`)
- `SCANNER_PORT` - HTTP server port (default: 8080)
- `SCANNER_WORKER_COUNT` - Number of worker goroutines (default: 10)
- `SCANNER_MAX_DEPTH` - Maximum directory depth to scan (default: 4)
- `FFPROBE_PATH` - Path to ffprobe binary (default: "ffprobe")
- `FFPROBE_TIMEOUT_SECONDS` - FFProbe timeout in seconds (default: 30)
- `SCAN_QUEUE_NAME` - Redis queue name for metadata jobs (default: "metadata:jobs")
