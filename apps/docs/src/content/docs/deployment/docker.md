---
title: Docker Deployment
description: Deploy DesterLib with Docker in production
---

Production-ready Docker deployment guide for DesterLib.

## Production Setup

### Using CLI (Easiest)

```bash
npx @desterlib/cli
```

The CLI configures production-ready settings by default:
- Sets `NODE_ENV=production`
- Configures restart policies
- Sets up health checks
- Uses production database

### Manual Setup

```bash
git clone https://github.com/DesterLib/desterlib.git
cd desterlib

# Create .env in apps/api/
DATABASE_URL=postgresql://desterlib:STRONG_PASSWORD@postgres:5432/desterlib?schema=public
NODE_ENV=production
PORT=3001

# Start in production mode
docker-compose up -d
```

## Production Best Practices

### Resource Limits

Add resource limits to prevent overconsumption:

**Edit docker-compose.yml:**
```yaml
api:
  image: desterlib/api:latest
  deploy:
    resources:
      limits:
        cpus: '2.0'
        memory: 2G
      reservations:
        memory: 512M
        
postgres:
  image: postgres:15-alpine
  deploy:
    resources:
      limits:
        memory: 1G
      reservations:
        memory: 256M
```

### Persistent Volumes

Ensure data persists across container restarts:

```yaml
volumes:
  postgres_data:
    driver: local
    driver_opts:
      type: none
      device: /path/to/persistent/storage
      o: bind
```

### Health Checks

Both services include health checks by default:

```yaml
api:
  healthcheck:
    test: ["CMD-SHELL", "wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s

postgres:
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U desterlib"]
    interval: 10s
    timeout: 5s
    retries: 5
```

## Networking

### Expose to Network

The default configuration binds to `0.0.0.0`:

```yaml
ports:
  - "0.0.0.0:3001:3001"
```

This allows connections from:
- Local machine
- LAN devices
- Remote clients (if port forwarded)

### Internal Network Only

For localhost-only access:

```yaml
ports:
  - "127.0.0.1:3001:3001"
```

## Reverse Proxy

### Nginx

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name desterlib.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

### Caddy (Automatic HTTPS)

**Caddyfile:**
```
desterlib.yourdomain.com {
    reverse_proxy localhost:3001
}
```

Caddy automatically handles:
- HTTPS certificates (Let's Encrypt)
- Certificate renewal
- HTTP to HTTPS redirect

### Traefik

**docker-compose.yml:**
```yaml
api:
  image: desterlib/api:latest
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.desterlib.rule=Host(`desterlib.yourdomain.com`)"
    - "traefik.http.routers.desterlib.entrypoints=websecure"
    - "traefik.http.routers.desterlib.tls.certresolver=myresolver"
```

## Logging

### Configure Log Levels

Set in environment:

```env
NODE_ENV=production  # Less verbose
# or
NODE_ENV=development # More verbose (debug logs)
```

### Log Drivers

**Use JSON log format:**

```yaml
api:
  image: desterlib/api:latest
  logging:
    driver: "json-file"
    options:
      max-size: "10m"
      max-file: "3"
```

### External Logging

**To syslog:**
```yaml
logging:
  driver: syslog
  options:
    syslog-address: "tcp://192.168.1.100:514"
```

**To file:**
```yaml
logging:
  driver: json-file
  options:
    max-size: "100m"
    max-file: "5"
    compress: "true"
```

## Monitoring

### Docker Health Checks

View health status:

```bash
docker ps
```

Look for "healthy" in the STATUS column.

### Prometheus Metrics (Future)

Prometheus integration is planned for future releases.

## Security

### Network Isolation

Create isolated Docker network:

```yaml
networks:
  desterlib-net:
    driver: bridge
    internal: false

services:
  postgres:
    networks:
      - desterlib-net
  
  api:
    networks:
      - desterlib-net
```

### Read-Only Media Mount

Media is mounted read-only for security:

```yaml
volumes:
  - /path/to/media:/media:ro  # :ro = read-only
```

### Non-Root User (Future)

Running as non-root user is planned for future releases.

## Scaling

### Single Server

Current setup is designed for single-server deployment:
- One API instance
- One PostgreSQL instance
- Suitable for personal use (1-100 users)

### Future: Multi-Instance

Horizontal scaling is planned for future releases with:
- Multiple API instances behind load balancer
- Shared PostgreSQL database
- Redis for session management

## Backup in Production

### Automated Database Backups

**Create backup service:**

```yaml
# Add to docker-compose.yml
backup:
  image: postgres:15-alpine
  depends_on:
    - postgres
  volumes:
    - ./backups:/backups
    - postgres_data:/var/lib/postgresql/data:ro
  command: >
    sh -c "while true; do
      pg_dump -U desterlib -h postgres desterlib > /backups/backup-$$(date +%Y%m%d-%H%M%S).sql
      sleep 86400
    done"
  restart: unless-stopped
```

This creates daily backups in `./backups/`.

## Updating in Production

### Zero-Downtime Updates (Future)

Currently, updates require brief downtime:

```bash
cd ~/.desterlib
docker-compose pull
docker-compose up -d
```

Downtime: ~10-30 seconds during container restart.

### Scheduled Maintenance

Recommend updating during low-usage times:

```bash
# Schedule with cron at 3 AM
0 3 * * 0 cd ~/.desterlib && docker-compose pull && docker-compose up -d
```

## Troubleshooting

### Container Keeps Restarting

**Check logs:**
```bash
docker-compose logs --tail=100 api
```

**Common causes:**
- Database connection failure
- Invalid environment variables
- Port already in use
- Missing required config

### High Memory Usage

**Check resource usage:**
```bash
docker stats
```

**If too high:**
1. Add memory limits (see Resource Limits above)
2. Check for memory leaks in logs
3. Restart containers: `docker-compose restart`

### Database Performance

**For large libraries (10,000+ items):**

1. **Increase database resources:**
   ```yaml
   postgres:
     deploy:
       resources:
         limits:
           memory: 2G
   ```

2. **Optimize PostgreSQL:**
   ```yaml
   postgres:
     command: postgres -c shared_buffers=256MB -c max_connections=200
   ```

## Related Documentation

- [Installation Guide](/getting-started/installation/) - Initial setup
- [Managing Server](/guides/managing-server/) - Day-to-day management
- [Remote Access](/guides/remote-access/) - External access options
- [Backup & Restore](/guides/backup-restore/) - Data protection

