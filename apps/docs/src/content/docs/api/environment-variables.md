---
title: Environment Variables
description: Environment variables used by the DesterLib API server
---

Complete reference for configuring the DesterLib API server via environment variables.

## Required Variables

### DATABASE_URL

**PostgreSQL connection string**

```env
DATABASE_URL=postgresql://username:password@host:port/database?schema=public
```

**Format:** `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public`

**Examples:**

```env
# Docker Compose (default)
DATABASE_URL=postgresql://desterlib:password@postgres:5432/desterlib?schema=public

# External database
DATABASE_URL=postgresql://user:pass@db.example.com:5432/desterlib?schema=public

# Local development
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/desterlib_test?schema=public
```

**Used by:** Prisma ORM for all database operations

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

## Docker-Specific Variables

These are used by Docker Compose to configure the PostgreSQL container, **not** by the API directly:

### POSTGRES_USER

**Database username**

```yaml
# In docker-compose.yml environment section
POSTGRES_USER: desterlib
```

**Used by:** PostgreSQL container initialization

### POSTGRES_PASSWORD

**Database password**

```yaml
POSTGRES_PASSWORD: your_secure_password
```

**Used by:** PostgreSQL container initialization

### POSTGRES_DB

**Database name**

```yaml
POSTGRES_DB: desterlib
```

**Used by:** PostgreSQL container initialization

## Variables NOT Used

These variables are **NOT** read by the DesterLib API:

### ❌ FRONTEND_URL

Not used. CORS is configured automatically for local network access.

### ❌ JWT_SECRET

Stored in database settings, not environment variables.

### ❌ TMDB_API_KEY

Configured via Settings API in the application, not environment variables.

### ❌ POSTGRES_HOST / POSTGRES_PORT

The API only uses `DATABASE_URL`. Individual postgres connection vars are not read.

## Configuration Methods

### Method 1: .env File (Recommended)

Create `.env` in the API directory:

**CLI installation:**

```bash
nano ~/.desterlib/.env
```

**Git installation:**

```bash
nano apps/api/.env
```

**Example .env:**

```env
DATABASE_URL=postgresql://desterlib:password@postgres:5432/desterlib?schema=public
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
    DATABASE_URL: postgresql://...
    NODE_ENV: production
    PORT: 3001
    RATE_LIMIT_WINDOW_MS: 900000
    RATE_LIMIT_MAX: 100
```

### Method 3: System Environment

Export before running:

```bash
export DATABASE_URL="postgresql://..."
export PORT=3001
pnpm start
```

## Examples

### Development Setup

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/desterlib_test?schema=public
NODE_ENV=development
PORT=3001
RATE_LIMIT_WINDOW_MS=60000   # 1 minute for testing
RATE_LIMIT_MAX=1000          # More lenient for development
```

### Production Setup

```env
DATABASE_URL=postgresql://desterlib:STRONG_PASSWORD@postgres:5432/desterlib?schema=public
NODE_ENV=production
PORT=3001
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100           # Standard rate limiting
```

### High-Traffic Setup

```env
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3001
RATE_LIMIT_WINDOW_MS=600000  # 10 minutes (shorter window)
RATE_LIMIT_MAX=200           # Allow more requests
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
🗄️  Database: postgresql://desterlib:***@postgres:5432/desterlib
```

### Test Database Connection

```bash
# Check if API can reach database
curl http://localhost:3001/health
```

Should return `{"status":"OK",...}`

## Troubleshooting

### Database Connection Failed

**Error:** `Error: P1001: Can't reach database server`

**Fixes:**

1. Check `DATABASE_URL` format
2. Verify database is running: `docker ps | grep postgres`
3. Test connection:
   ```bash
   docker exec -it desterlib-postgres psql -U desterlib -d desterlib
   ```

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

**Generate secure password:**

```bash
openssl rand -base64 32
```

Use this for `POSTGRES_PASSWORD` in your database connection.

## Related Documentation

- [Installation Guide](/getting-started/installation/) - Initial setup
- [API Overview](/api/overview/) - API server documentation
- [Managing Server](/guides/managing-server/) - Server management
- [CLI Tool](/cli/overview/) - CLI documentation
