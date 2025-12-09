---
title: Security Guide
description: Security best practices for DesterLib
---

:::caution[Alpha Security]
DesterLib is in alpha and **does not yet have authentication**. The API is currently open to anyone on your network.
:::

## Best Practices

### Local Network Only (Recommended)

- Keep DesterLib on your local network
- Use Tailscale for remote access
- Don't expose to internet without authentication

### If Exposing to Internet

1. Use HTTPS (reverse proxy required)
2. Monitor access logs
3. Keep system updated
4. Enable authentication when available

### Database Security

```bash
# Set proper file permissions
chmod 600 desterlib-data/db/main.db
```

### Docker Security

- Media files are mounted read-only (`:ro`)
- Containers run in isolated network
- Keep Docker images updated
