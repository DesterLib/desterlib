---
title: Remote Access
description: Access your DesterLib server from outside your home network
---

Access your media library from anywhere! This guide covers secure remote access options.

## Quick Options

| Method | Difficulty | Security | Best For |
|--------|-----------|----------|----------|
| Tailscale | ⭐ Easy | 🔒 Excellent | Most users |
| Cloudflare Tunnel | ⭐⭐ Moderate | 🔒 Excellent | Advanced users |
| Port Forwarding + DDNS | ⭐⭐⭐ Hard | ⚠️ Manual setup needed | Self-hosters |
| ngrok | ⭐ Easy | ⚠️ Temporary | Testing only |

## Option 1: Tailscale (Recommended)

**Best for:** Everyone - it's free, secure, and easy!

### What is Tailscale?

Tailscale creates a secure VPN between your devices. No port forwarding needed!

### Setup Steps

1. **Install Tailscale:**
   - [Download for your OS](https://tailscale.com/download)
   - Install on server and all client devices

2. **Sign up and connect:**
   - Create a free account
   - Log in on each device
   - They're now on the same network!

3. **Find your server IP:**
   ```bash
   tailscale ip -4
   ```
   
   Example: `100.64.123.45`

4. **Connect from client:**
   - Use the Tailscale IP in your DesterLib app
   - Example: `http://100.64.123.45:3001`

**That's it!** Access from anywhere, completely secure.

### Benefits

- ✅ No port forwarding
- ✅ End-to-end encrypted
- ✅ Works behind NAT/CGNAT
- ✅ Free for personal use
- ✅ Multi-platform support

## Option 2: Cloudflare Tunnel

**Best for:** Users who want a public URL without exposing their home IP.

### Setup Steps

1. **Install cloudflared:**
   ```bash
   # macOS
   brew install cloudflare/cloudflare/cloudflared
   
   # Linux
   wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   
   # Windows - download from Cloudflare
   ```

2. **Authenticate:**
   ```bash
   cloudflared tunnel login
   ```

3. **Create tunnel:**
   ```bash
   cloudflared tunnel create desterlib
   ```

4. **Configure tunnel** (`~/.cloudflared/config.yml`):
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: /path/to/credentials.json
   
   ingress:
     - hostname: desterlib.yourdomain.com
       service: http://localhost:3001
     - service: http_status:404
   ```

5. **Run tunnel:**
   ```bash
   cloudflared tunnel run desterlib
   ```

6. **Access via:**
   `https://desterlib.yourdomain.com`

### Benefits

- ✅ No port forwarding
- ✅ Automatic HTTPS
- ✅ Cloudflare protection
- ✅ Custom domain
- ✅ Free tier available

## Option 3: Port Forwarding + DDNS

**Best for:** Self-hosters comfortable with networking.

### Requirements

- Router with port forwarding capability
- Dynamic DNS service (or static IP)

### Steps

1. **Configure port forwarding on router:**
   - Forward external port 3001 → internal port 3001
   - Target your server's local IP (e.g., 192.168.1.100)

2. **Set up Dynamic DNS:**
   - Use [DuckDNS](https://www.duckdns.org/) (free)
   - Or [No-IP](https://www.noip.com/)
   - Create hostname like: `mydesterlib.duckdns.org`

3. **Update DDNS automatically:**
   ```bash
   # Example DuckDNS update script
   curl "https://www.duckdns.org/update?domains=mydesterlib&token=YOUR_TOKEN"
   ```

4. **Access via:**
   `http://mydesterlib.duckdns.org:3001`

### Security Considerations

:::danger[Security Warning]
Port forwarding exposes your server to the internet. You MUST:
- Use strong database passwords
- Enable authentication (when available)
- Consider using HTTPS (see below)
- Keep DesterLib updated
:::

### Add HTTPS (Recommended)

Use a reverse proxy with Let's Encrypt:

```bash
# Install Caddy (automatic HTTPS)
sudo apt install caddy

# Configure Caddy
sudo nano /etc/caddy/Caddyfile
```

```
mydesterlib.duckdns.org {
    reverse_proxy localhost:3001
}
```

```bash
# Start Caddy
sudo systemctl start caddy
```

Now access via: `https://mydesterlib.duckdns.org`

## Option 4: ngrok (Testing Only)

**Best for:** Quick testing, not permanent use.

### Quick Setup

```bash
# Install ngrok
brew install ngrok  # macOS

# Authenticate (free account)
ngrok authtoken YOUR_TOKEN

# Create tunnel
ngrok http 3001
```

You'll get a URL like: `https://abc123.ngrok.io`

:::caution[Temporary]
- URL changes every time you restart
- Free tier has session limits
- Not suitable for permanent use
:::

## Comparing Options

### Speed

| Method | Latency | Throughput |
|--------|---------|------------|
| Tailscale | ~20-50ms added | Excellent (direct peer-to-peer) |
| Cloudflare Tunnel | ~50-100ms added | Good (proxied through CF) |
| Port Forward | ~0ms added | Excellent (direct) |
| ngrok | ~50-150ms added | Moderate (free tier) |

### Security

**Most Secure to Least:**
1. Tailscale (encrypted VPN)
2. Cloudflare Tunnel (proxied + HTTPS)
3. Port Forward + HTTPS + Auth
4. Port Forward (HTTP only) ⚠️
5. ngrok (temporary URLs)

## Firewall Configuration

### Allow DesterLib Through Firewall

**macOS:**
```bash
# Docker Desktop usually handles this
# If issues, add rule in System Preferences → Security & Privacy → Firewall
```

**Linux (ufw):**
```bash
sudo ufw allow 3001/tcp
sudo ufw reload
```

**Windows Firewall:**
1. Windows Security → Firewall & network protection
2. Advanced settings → Inbound Rules
3. New Rule → Port → TCP 3001 → Allow

## Testing Remote Access

### From Client Device

```bash
# Test from outside your network
curl http://YOUR_PUBLIC_URL:3001/health
```

Expected response:
```json
{"status":"OK","timestamp":"...","uptime":12345}
```

### From Browser

Visit: `http://YOUR_PUBLIC_URL:3001/api/docs`

Should show Swagger documentation.

## Mobile Data Usage

When streaming remotely:
- **HD movie (2 hours)**: ~2-4GB
- **SD movie (2 hours)**: ~0.5-1GB
- **4K movie (2 hours)**: ~10-20GB

Consider your mobile data plan when streaming!

## Troubleshooting

### Can't Connect Remotely

**Checklist:**
1. ✅ Server running? → `docker ps`
2. ✅ Port forwarded correctly? → Check router settings
3. ✅ Firewall allows port? → Test with `telnet YOUR_IP 3001`
4. ✅ DDNS updated? → Check your DDNS provider
5. ✅ Using correct IP/domain? → Test from inside network first

### Works Locally, Not Remotely

**Likely causes:**
- Router not forwarding port → Check port forwarding rules
- ISP blocks port 3001 → Try different port (8080, 8443)
- CGNAT (Carrier-Grade NAT) → Use Tailscale or Cloudflare Tunnel
- Firewall blocking → Temporarily disable to test

### Slow Streaming

**Fixes:**
- Check upload speed on server → `speedtest-cli`
- Reduce video quality in client app
- Consider transcoding (future feature)
- Use wired connection on server

## Security Best Practices

When exposing to internet:

1. ✅ **Use HTTPS** - Encrypt traffic
2. ✅ **Enable authentication** - When available in DesterLib
3. ✅ **Strong passwords** - For database and future auth
4. ✅ **Keep updated** - Install updates regularly
5. ✅ **Monitor logs** - Watch for suspicious activity
6. ✅ **Use VPN** - Tailscale is recommended over public exposure

## Related Documentation

- [Managing Server](/guides/managing-server/) - Server management
- [Installation Guide](/getting-started/installation/) - Initial setup
- [Troubleshooting](/getting-started/installation/#troubleshooting) - Common issues

