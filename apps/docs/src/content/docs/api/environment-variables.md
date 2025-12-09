---
title: Environment Variables
description: Environment variables used by the DesterLib API server
---

Complete reference for configuring the DesterLib API server via environment variables.

## Required Variables

### DATABASE_URL

**SQLite database file path**

```env
DATABASE_URL=file:/path/to/database.db
```

**Format:** `file:/absolute/path/to/database.db` or `/absolute/path/to/database.db`

**Examples:**

```env
# Docker Compose (default)
DATABASE_URL=file:/app/db/main.db

# Local development
DATABASE_URL=file:./desterlib-data/db/main.db

# Absolute path
DATABASE_URL=/Users/username/desterlib-data/db/main.db
```

**Used by:** Prisma ORM for all database operations

### METADATA_PATH

**Path to metadata storage directory**

```env
METADATA_PATH=/path/to/desterlib-data/metadata
```

**Purpose:** Directory where metadata images (posters, backdrops) are stored

**Examples:**

```env
# Absolute path
METADATA_PATH=/Volumes/External/Projects/Dester/desterlib/desterlib-data/metadata

# Relative to project root (when running from project directory)
METADATA_PATH=./desterlib-data/metadata
```

**Note:** This path is shared between the API and metadata-service. Both services must use the same path.

### API_LOG_PATH

**Path to API logs directory**

```env
API_LOG_PATH=/path/to/desterlib-data/logs
```

**Purpose:** Directory where API log files are stored (e.g., `combined.log`)

**Examples:**

```env
# Absolute path
API_LOG_PATH=/Volumes/External/Projects/Dester/desterlib/desterlib-data/logs

# Relative to project root
API_LOG_PATH=./desterlib-data/logs
```

**Note:** The API will create `combined.log` in this directory.

### SCAN_JOB_LOG_PATH (Metadata Service)

**Path to scan job failure logs directory**

```env
SCAN_JOB_LOG_PATH=/path/to/desterlib-data/logs/scan-jobs
```

**Purpose:** Directory where metadata-service stores scan job failure logs

**Examples:**

```env
# Absolute path
SCAN_JOB_LOG_PATH=/Volumes/External/Projects/Dester/desterlib/desterlib-data/logs/scan-jobs

# Relative to project root
SCAN_JOB_LOG_PATH=./desterlib-data/logs/scan-jobs
```

**Note:** This is required by the metadata-service, not the API. The metadata-service will create scan-job-specific log files in this directory.

### SCANNER_LOG_PATH (Scanner Service)

**Path to scanner service logs directory**

```env
SCANNER_LOG_PATH=/path/to/desterlib-data/logs
```

**Purpose:** Directory where scanner service log files are stored (e.g., `scanner.log`)

**Examples:**

```env
# Absolute path
SCANNER_LOG_PATH=/Volumes/External/Projects/Dester/desterlib/desterlib-data/logs

# Relative to project root
SCANNER_LOG_PATH=./desterlib-data/logs
```

**Note:** This is optional. If not set, scanner service logs only to stdout/stderr. If set, logs will be written to both the file and stdout (for Docker container log capture).

## Optional Variables

### NODE_ENV

**Application environment mode**

```env
NODE_ENV=production
```

**Values:**

- `production` - Production mode (default)
- `development` - Development mode with debug logging

**Default:** `development`

**Effects:**

- Logging verbosity
- Error message details
- CORS policy (more permissive in dev)
- Database query logging

### PORT

**API server port**

```env
PORT=3001
```

**Valid range:** 1024-65535  
**Default:** `3001` (from database settings)

**Used by:** Express HTTP server

### RATE_LIMIT_WINDOW_MS

**Rate limiting time window in milliseconds**

```env
RATE_LIMIT_WINDOW_MS=900000
```

**Default:** `900000` (15 minutes)

**Purpose:** Prevents API abuse by limiting request frequency

**Note:** Localhost, scan routes, and stream routes are exempt from rate limiting.

### RATE_LIMIT_MAX

**Maximum requests per window**

```env
RATE_LIMIT_MAX=100
```

**Default:** `100` requests

**Purpose:** Maximum number of requests allowed per time window (see above)

**Calculation:** With defaults, clients can make 100 requests per 15 minutes.

## Variables NOT Used

These variables are **NOT** read by the DesterLib API:

### ❌ FRONTEND_URL

Not used. CORS is configured automatically for local network access.

### ❌ JWT_SECRET

Stored in database settings, not environment variables.

### ❌ TMDB_API_KEY

Configured via Settings API or Provider Management API, not environment variables. See [TMDB Setup Guide](/guides/tmdb-setup/) for details.

## Configuration Methods

### Method 1: .env File (Recommended)

Create `.env` in the project root:

**CLI installation:**

```bash
nano ~/.desterlib/.env
```

**Git installation:**

```bash
nano .env
```

**Example .env:**

```env
# Required
DATABASE_URL=file:/app/db/main.db
METADATA_PATH=/path/to/desterlib-data/metadata
API_LOG_PATH=/path/to/desterlib-data/logs

# Optional
NODE_ENV=production
PORT=3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Method 2: Docker Compose Environment

Set directly in `docker-compose.yml`:

```yaml
api:
  image: desterlib/api:latest
  environment:
    # Required
    DATABASE_URL: file:/app/db/main.db
    METADATA_PATH: /var/lib/desterlib/metadata
    API_LOG_PATH: /var/lib/desterlib/logs
    # Optional
    NODE_ENV: production
    PORT: 3001
    RATE_LIMIT_WINDOW_MS: 900000
    RATE_LIMIT_MAX: 100
  volumes:
    - ./desterlib-data:/var/lib/desterlib
```

### Method 3: System Environment

Export before running:

```bash
export DATABASE_URL="file:./desterlib-data/db/main.db"
export PORT=3001
pnpm start
```

## Examples

### Development Setup

```env
# Required
DATABASE_URL=file:./desterlib-data/db/main.db
METADATA_PATH=./desterlib-data/metadata
API_LOG_PATH=./desterlib-data/logs

# Optional
NODE_ENV=development
PORT=3001
RATE_LIMIT_WINDOW_MS=60000   # 1 minute for testing
RATE_LIMIT_MAX=1000          # More lenient for development
```

### Production Setup

```env
# Required
DATABASE_URL=file:/app/db/main.db
METADATA_PATH=/app/metadata
API_LOG_PATH=/app/logs

# Optional
NODE_ENV=production
PORT=3001
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100           # Standard rate limiting
```

## Validation

### Check Current Configuration

Start the server and check logs:

```bash
docker-compose up -d
docker-compose logs api | head -20
```

You should see:

```
🚀 Server running on port 3001
🔧 Environment: production
🗄️  Database: file:/app/db/main.db
```

### Test Database Connection

```bash
# Check if API can reach database
curl http://localhost:3001/health
```

Should return `{"status":"OK",...}`

## Troubleshooting

### Database Connection Failed

**Error:** `Error: Can't reach database server`

**Fixes:**

1. Check `DATABASE_URL` format (should be `file:/path/to/db.db`)
2. Verify database file exists and is accessible
3. Check file permissions

### Port Already in Use

**Error:** `EADDRINUSE: address already in use :::3001`

**Fixes:**

1. Change `PORT` to different number (e.g., `3002`)
2. Or kill process using port 3001:
   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

### Rate Limiting Too Aggressive

If clients get rate limited often:

```env
# Increase limits
RATE_LIMIT_WINDOW_MS=1800000  # 30 minutes
RATE_LIMIT_MAX=200            # 200 requests
```

Then restart: `docker-compose restart api`

## Security Recommendations

### Production Checklist

- ✅ Use strong, random database passwords
- ✅ Don't commit `.env` to git (it's in `.gitignore`)
- ✅ Use `NODE_ENV=production` in production
- ✅ Keep rate limits reasonable
- ✅ Monitor logs for suspicious activity

### Database Security

**Note:** SQLite doesn't require a password. Ensure database file has proper permissions (600 recommended).

## Related Documentation

- [Installation Guide](/getting-started/installation/) - Initial setup
- [API Overview](/api/overview/) - API server documentation
- [Managing Server](/guides/managing-server/) - Server management
- [CLI Tool](/cli/overview/) - CLI documentation
