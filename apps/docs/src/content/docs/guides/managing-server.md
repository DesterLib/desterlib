---
title: Managing Your Server
description: How to start, stop, update, and maintain your DesterLib server
---

This guide covers common server management tasks for DesterLib.

## Installation Location

Commands vary based on how you installed DesterLib:

| Installation Method        | Location                         |
| -------------------------- | -------------------------------- |
| CLI (`npx @desterlib/cli`) | `~/.desterlib`                   |
| Git clone                  | `./desterlib` (where you cloned) |

:::tip
This guide assumes **CLI installation**. If you used git clone, replace `~/.desterlib` with your repo directory.
:::

## Starting the Server

### First Time Start

During CLI setup, you're asked if you want to start the server. If you chose "No":

```bash
cd ~/.desterlib
docker-compose up -d
```

### After Stopping

```bash
cd ~/.desterlib
docker-compose up -d
```

The `-d` flag runs containers in the background (detached mode).

## Stopping the Server

### Temporary Stop (Keeps Data)

```bash
cd ~/.desterlib
docker-compose down
```

This stops containers but preserves:

- ✅ Database data
- ✅ Configuration files
- ✅ Downloaded images

### Full Stop (Removes Everything)

```bash
cd ~/.desterlib
docker-compose down -v
```

:::danger[Data Loss Warning]
The `-v` flag removes Docker volumes, **deleting your database**! Only use if you want to completely reset.
:::

## Viewing Status

### Check Running Containers

```bash
cd ~/.desterlib
docker-compose ps
```

Expected output:

```
NAME                  STATUS        PORTS
desterlib-redis       Up 5 minutes  0.0.0.0:6379->6379/tcp
desterlib-api         Up 5 minutes  0.0.0.0:3001->3001/tcp
desterlib-scanner     Up 5 minutes  0.0.0.0:8080->8080/tcp
```

### View Logs

**All services:**

```bash
docker-compose logs -f
```

**API only:**

```bash
docker-compose logs -f api
```

**Scanner service only:**

```bash
docker-compose logs -f scanner-service
```

**Last 100 lines:**

```bash
docker-compose logs --tail=100 api
```

Press `Ctrl+C` to stop following logs.

## Restarting the Server

### Restart All Services

```bash
cd ~/.desterlib
docker-compose restart
```

### Restart Specific Service

```bash
docker-compose restart api            # API only
docker-compose restart scanner-service # Scanner only
docker-compose restart redis          # Redis only
```

## Updating DesterLib

### CLI Installation

```bash
cd ~/.desterlib

# Pull latest Docker images
docker-compose pull

# Restart with new images
docker-compose up -d
```

### Git Installation

```bash
cd desterlib

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build
```

## Configuration Changes

### Edit Configuration

**CLI installation:**

```bash
cd ~/.desterlib
nano .env  # or use your preferred editor
```

**After editing**, restart to apply:

```bash
docker-compose restart
```

### Reconfigure via CLI

Run the CLI again to regenerate config:

```bash
npx @desterlib/cli
```

Choose "Reconfigure" when prompted.

## Backup & Restore

### Backup Database

```bash
cd ~/.desterlib
docker-compose stop
cp desterlib-data/db/main.db ~/desterlib-backup.db
docker-compose start
```

### Restore Database

```bash
cd ~/.desterlib
docker-compose down
cp ~/desterlib-backup.db desterlib-data/db/main.db
docker-compose up -d
```

### Backup Configuration

```bash
# CLI installation
cp -r ~/.desterlib ~/desterlib-config-backup

# Git installation
tar -czf desterlib-config.tar.gz desterlib/
```

## Resource Usage

### View Resource Consumption

```bash
docker stats
```

Shows CPU, memory, and network usage for all containers.

### Limit Resources

Edit `docker-compose.yml` to add resource limits:

```yaml
api:
  image: desterlib/api:latest
  deploy:
    resources:
      limits:
        cpus: "2.0"
        memory: 2G
```

Then restart: `docker-compose up -d`

## Network Configuration

### Change Port

**Edit** `.env`:

```env
PORT=3002  # Change from 3001
```

**Restart:**

```bash
docker-compose down
docker-compose up -d
```

### Access from Network

The API is already configured to accept connections from your local network (LAN). Just use your server's IP:

```
http://192.168.1.100:3001
```

Find your IP:

- **macOS/Linux:** `ifconfig | grep "inet "`
- **Windows:** `ipconfig`

## Monitoring

### Health Check

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345
}
```

### View Database Status

```bash
# Check database file size
ls -lh ~/.desterlib/desterlib-data/db/main.db

# Check API health
curl http://localhost:3001/health
```

## Troubleshooting

### Container Won't Start

**Check what failed:**

```bash
docker-compose logs api
docker-compose logs scanner-service
```

**Common issues:**

- Port already in use → Change port in `.env` or stop conflicting process
- Permission denied → Check media path permissions
- Database file locked → Stop services and check file permissions

### High CPU/Memory Usage

**During scan:**

- This is normal - scanning is resource-intensive
- CPU usage is high when processing metadata
- Will return to normal after scan completes

**Constantly high:**

- Check logs for errors or infinite loops
- Restart the API: `docker-compose restart api`

## Related Documentation

- [CLI Tool](/cli/overview/) - CLI usage and options
- [Updating Guide](/guides/updating/) - Update procedures
- [Backup Guide](/guides/backup-restore/) - Comprehensive backup strategies
- [Troubleshooting](/getting-started/installation/#troubleshooting) - Common issues
