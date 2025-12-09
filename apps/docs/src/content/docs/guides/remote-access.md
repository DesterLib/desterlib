---
title: Remote Access
description: Access your DesterLib server from outside your home network
---

## Tailscale (Recommended)

Easiest and most secure option:

1. Install [Tailscale](https://tailscale.com/download) on server and devices
2. Sign up and log in on each device
3. Find server IP: `tailscale ip -4`
4. Use that IP in your DesterLib app: `http://100.64.x.x:3001`

**Benefits:** Free, encrypted, no port forwarding needed.

## Other Options

- **Cloudflare Tunnel** - Public URL without exposing IP
- **Port Forwarding** - Forward port 3001 on your router
- **ngrok** - Temporary tunnel for testing

:::caution[Security]
DesterLib doesn't have authentication yet. Only expose to internet if necessary and use HTTPS.
:::
