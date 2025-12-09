---
title: Docker Deployment
description: Deploy DesterLib with Docker
---

## Quick Start

```bash
cd docker
docker-compose up -d --build
```

**Services:**

- API: `http://localhost:3001` (docs at `/api/docs`)
- Scanner: `http://localhost:8080`
- Redis: `localhost:6379`

## Configuration

Update the media library path in `docker-compose.yml`:

```yaml
volumes:
  - /path/to/your/media:/media:ro
```

## Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after changes
docker-compose up -d --build
```

## Troubleshooting

**Port conflicts:**

```bash
lsof -i :3001  # Find what's using the port
kill <PID>    # Stop it
```

**Check status:**

```bash
docker-compose ps
curl http://localhost:3001/health
```
