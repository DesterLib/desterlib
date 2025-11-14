---
title: Security Guide
description: Best practices for securing your DesterLib installation
---

Security considerations for self-hosting DesterLib.

## Current Security Status

:::caution[Alpha Security]
DesterLib is in alpha and **does not yet have authentication**. The API is currently open to anyone on your network.

**Planned features:**
- JWT authentication
- User accounts
- Access control
- API keys
:::

## Network Security

### Local Network Only (Safest)

**Recommended for:** Most users

Keep DesterLib on your local network:
- ✅ No port forwarding
- ✅ No public exposure
- ✅ Access via LAN only
- ✅ Use Tailscale for remote access

### Exposed to Internet

**Only if necessary**, and follow these rules:

1. ✅ **Use HTTPS** (reverse proxy required)
2. ✅ **Monitor access logs** regularly
3. ✅ **Use strong database passwords**
4. ✅ **Keep system updated**
5. ✅ **Enable authentication** (when available)

## Database Security

### Strong Passwords

Generate secure password:

```bash
openssl rand -base64 32
```

Use in your configuration:

```env
DATABASE_URL=postgresql://desterlib:GENERATED_PASSWORD_HERE@postgres:5432/desterlib?schema=public
```

### Don't Expose Database Port

**Default (Secure):**
```yaml
postgres:
  ports:
    - "127.0.0.1:5432:5432"  # Localhost only
```

**Insecure (Avoid):**
```yaml
postgres:
  ports:
    - "0.0.0.0:5432:5432"  # Exposed to network ❌
```

## Docker Security

### Read-Only Media Mount

Media files are mounted read-only:

```yaml
volumes:
  - /path/to/media:/media:ro  # :ro prevents writes
```

DesterLib can't modify your media files.

### Container Isolation

Containers run in isolated network:

```yaml
networks:
  desterlib-net:
    driver: bridge
```

### Regular Updates

Keep Docker images updated:

```bash
docker-compose pull
docker-compose up -d
```

## File Permissions

### Media Directory

Recommended permissions:

```bash
# Server can read, but not write
chmod -R 755 /path/to/media
```

### Configuration Files

Protect sensitive files:

```bash
chmod 600 ~/.desterlib/.env  # Only owner can read/write
chmod 644 ~/.desterlib/docker-compose.yml
```

## HTTPS Setup

### Option 1: Caddy (Easiest)

**Install Caddy:**
```bash
sudo apt install caddy  # Ubuntu/Debian
brew install caddy      # macOS
```

**Configure (Caddyfile):**
```
desterlib.yourdomain.com {
    reverse_proxy localhost:3001
}
```

**Start:**
```bash
sudo caddy start
```

Caddy automatically:
- ✅ Gets Let's Encrypt certificate
- ✅ Renews certificates
- ✅ Redirects HTTP → HTTPS

### Option 2: Nginx + Certbot

**Install:**
```bash
sudo apt install nginx certbot python3-certbot-nginx
```

**Configure nginx:**
```nginx
server {
    listen 80;
    server_name desterlib.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Get certificate:**
```bash
sudo certbot --nginx -d desterlib.yourdomain.com
```

## Firewall Rules

### UFW (Ubuntu/Debian)

```bash
# Allow SSH (don't lock yourself out!)
sudo ufw allow ssh

# Allow DesterLib
sudo ufw allow 3001/tcp

# If using HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

### firewalld (CentOS/RHEL)

```bash
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --reload
```

### macOS

System Preferences → Security & Privacy → Firewall → Firewall Options
- Add Docker.app
- Allow incoming connections

## Monitoring & Alerts

### Log Monitoring

Watch for suspicious activity:

```bash
# Monitor API access
docker-compose logs -f api | grep -E "POST|PUT|DELETE"

# Monitor errors
docker-compose logs -f api | grep -i error
```

### Rate Limit Alerts

Monitor rate limiting:

```bash
docker-compose logs api | grep "Too many requests"
```

If you see many, someone may be abusing your API.

## Authentication (Planned)

When authentication is implemented:

### Planned Features

- JWT-based authentication
- User registration and login
- Role-based access control
- API key management
- Session management

### Current Workaround

Use network-level security:
- Keep on private network
- Use VPN (Tailscale)
- Use reverse proxy with auth (Authelia, OAuth2 Proxy)

## Data Protection

### What's Sensitive

**High priority:**
- Database (has your library metadata)
- `.env` file (has credentials)

**Low priority:**
- Docker images (public)
- `docker-compose.yml` (no secrets if using .env)

### Encryption

**Database encryption:**
- PostgreSQL doesn't encrypt by default
- Use disk encryption at OS level (LUKS, FileVault, BitLocker)

**Transport encryption:**
- Use HTTPS for remote access
- Tailscale encrypts all traffic automatically

## Incident Response

### If Compromised

1. **Immediately:**
   ```bash
   docker-compose down
   ```

2. **Change all passwords:**
   - Database password
   - Update in `.env` and `docker-compose.yml`

3. **Review logs:**
   ```bash
   docker-compose logs api > incident-logs.txt
   ```

4. **Restore from backup:**
   - See [Backup Guide](/guides/backup-restore/)

5. **Update everything:**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## Security Checklist

Before going to production:

- [ ] Strong database password (32+ characters)
- [ ] `.env` file has correct permissions (600)
- [ ] Media mounted read-only (`:ro`)
- [ ] Firewall configured
- [ ] Using HTTPS (if exposed to internet)
- [ ] Regular backups configured
- [ ] Monitoring in place
- [ ] Keep containers updated weekly

## Reporting Security Issues

Found a security vulnerability?

**DO NOT** open a public issue.

Email: security@dester.in (or GitHub security advisory)

We'll respond within 48 hours.

## Related Documentation

- [Docker Deployment](/deployment/docker/) - Production deployment
- [Remote Access](/guides/remote-access/) - Secure remote access
- [Environment Variables](/api/environment-variables/) - Configuration
- [Backup & Restore](/guides/backup-restore/) - Data protection

