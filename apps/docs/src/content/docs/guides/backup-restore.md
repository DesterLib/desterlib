---
title: Backup & Restore
description: How to backup and restore your DesterLib database and configuration
---

Protect your media library data with regular backups.

## What to Backup

### Database (Critical)

Your PostgreSQL database contains:

- Media library catalog
- Scan job history
- Settings and preferences
- Future: Watch progress, user data

**Size:** Usually < 100MB for large libraries

### Configuration Files (Important)

Your configuration includes:

- `docker-compose.yml` - Service definitions
- `.env` - Environment variables

**Size:** < 1KB

### Not Needed

You don't need to backup:

- Docker images (can be re-downloaded)
- Source code (if using setup script)
- Actual media files (just metadata is in database)

## Database Backup

### Manual Backup

Create a SQL dump of your database:

```bash
docker exec -t desterlib-postgres pg_dump -U desterlib desterlib > desterlib-backup-$(date +%Y%m%d).sql
```

This creates a file like: `desterlib-backup-20241113.sql`

### Automated Backups

**Create a backup script** (`backup-desterlib.sh`):

```bash
#!/bin/bash
BACKUP_DIR=~/desterlib-backups
mkdir -p $BACKUP_DIR

# Database backup
docker exec -t desterlib-postgres pg_dump -U desterlib desterlib > \
  $BACKUP_DIR/db-$(date +%Y%m%d-%H%M%S).sql

# Keep only last 7 days
find $BACKUP_DIR -name "db-*.sql" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR"
```

**Make executable and run:**

```bash
chmod +x backup-desterlib.sh
./backup-desterlib.sh
```

**Schedule with cron** (Linux/Mac):

```bash
# Run daily at 2 AM
crontab -e

# Add this line:
0 2 * * * /path/to/backup-desterlib.sh
```

## Configuration Backup

### Setup Script Installation

```bash
# Backup entire config directory
cp -r ~/.desterlib ~/desterlib-config-backup-$(date +%Y%m%d)
```

### Git Installation

```bash
# Configuration is in your git repo
git stash  # Save any local changes
tar -czf desterlib-config-$(date +%Y%m%d).tar.gz \
  desterlib/apps/api/.env \
  desterlib/docker-compose.yml
```

## Restore Database

### From SQL Dump

```bash
# Stop the server first
cd ~/.desterlib
docker-compose down

# Start database only
docker-compose up -d postgres

# Wait for database to be ready (10 seconds)
sleep 10

# Restore from backup
cat desterlib-backup-20241113.sql | \
  docker exec -i desterlib-postgres psql -U desterlib desterlib

# Start all services
docker-compose up -d
```

### Verify Restore

```bash
# Check media count
docker exec -it desterlib-postgres psql -U desterlib -d desterlib \
  -c "SELECT COUNT(*) FROM \"Media\";"

# Check last updated
docker exec -it desterlib-postgres psql -U desterlib -d desterlib \
  -c "SELECT title, \"updatedAt\" FROM \"Media\" ORDER BY \"updatedAt\" DESC LIMIT 5;"
```

## Restore Configuration

### Setup Script Installation

```bash
# Stop server
cd ~/.desterlib && docker-compose down

# Restore from backup
rm -rf ~/.desterlib
cp -r ~/desterlib-config-backup-20241113 ~/.desterlib

# Start server
cd ~/.desterlib && docker-compose up -d
```

### Git Installation

```bash
# Extract backup
tar -xzf desterlib-config-20241113.tar.gz

# Or restore from git
git checkout apps/api/.env
git checkout docker-compose.yml
```

## Migrating to New Server

### Export from Old Server

```bash
# 1. Backup database
docker exec -t desterlib-postgres pg_dump -U desterlib desterlib > migration.sql

# 2. Backup configuration
cp ~/.desterlib/.env desterlib-env-backup
cp ~/.desterlib/docker-compose.yml desterlib-compose-backup

# 3. Transfer files to new server
scp migration.sql user@new-server:/tmp/
scp desterlib-*-backup user@new-server:/tmp/
```

### Import on New Server

```bash
# 1. Install DesterLib on new server
curl -fsSL https://raw.githubusercontent.com/DesterLib/desterlib/main/scripts/setup/unix.sh | bash

# 2. Stop the new server
cd ~/.desterlib && docker-compose down

# 3. Restore database
docker-compose up -d postgres
sleep 10
cat /tmp/migration.sql | docker exec -i desterlib-postgres psql -U desterlib desterlib

# 4. Restore config if needed
cp /tmp/desterlib-env-backup ~/.desterlib/.env

# 5. Start all services
docker-compose up -d
```

## Disaster Recovery

### Complete Loss Scenario

If you lose everything but have backups:

```bash
# 1. Install DesterLib fresh
curl -fsSL https://raw.githubusercontent.com/DesterLib/desterlib/main/scripts/setup/unix.sh | bash

# 2. Stop and restore database
cd ~/.desterlib
docker-compose down
docker-compose up -d postgres
sleep 10
cat backup.sql | docker exec -i desterlib-postgres psql -U desterlib desterlib
docker-compose up -d

# 3. Your media library is restored!
```

### Partial Data Loss

If only some data is corrupted:

```bash
# Rescan your media library
# Settings → Library Management → Scan Library
# TMDB metadata will be re-fetched
```

## Backup Storage

### Where to Store Backups

**Local (Quick Access):**

- Same machine: `~/desterlib-backups/`
- External drive: `/Volumes/Backup/desterlib/`

**Remote (Safer):**

- Cloud storage (Dropbox, Google Drive, iCloud)
- NAS (Synology, QNAP)
- Another server (rsync, scp)

### Rotation Strategy

**Keep:**

- ✅ Daily backups for last 7 days
- ✅ Weekly backups for last month
- ✅ Monthly backups for last year

**Example cleanup:**

```bash
# Keep daily (last 7 days)
find ~/desterlib-backups -name "db-*.sql" -mtime +7 -delete

# Archive weekly (older than 7 days, keep if Sunday)
# Archive monthly (first of month)
```

## Testing Backups

### Regular Testing

Test your backups monthly:

```bash
# 1. Create test environment
mkdir ~/desterlib-test
cd ~/desterlib-test

# 2. Copy config
cp -r ~/.desterlib/* .

# 3. Edit docker-compose.yml
# Change container names (desterlib-test-*)
# Change ports (3002, 5433)

# 4. Restore database
docker-compose up -d postgres
sleep 10
cat ~/desterlib-backups/latest.sql | docker exec -i desterlib-test-postgres psql -U desterlib desterlib

# 5. Start and test
docker-compose up -d
curl http://localhost:3002/health

# 6. Cleanup
docker-compose down -v
cd ~ && rm -rf desterlib-test
```

## Related Documentation

- [Managing Server](/guides/managing-server/) - Server management
- [Updating](/guides/updating/) - Update procedures
- [Troubleshooting](/getting-started/installation/#troubleshooting) - Common issues
- [Installation Guide](/getting-started/installation/) - Initial setup
