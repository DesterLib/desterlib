---
title: CLI Tool
description: DesterLib CLI - One-command installer for DesterLib
---

The DesterLib CLI is an interactive setup tool that installs and configures DesterLib with a single command.

## Overview

**Repository:** [@desterlib/cli](https://github.com/DesterLib/desterlib/tree/main/packages/cli)  
**Package:** `@desterlib/cli` on npm

### What It Does

The CLI handles the entire setup process:

- ✅ Checks Docker prerequisites
- ✅ Generates configuration files
- ✅ Pulls pre-built Docker images
- ✅ Starts your media server
- ✅ No Git or source code needed

### Installation

No installation required! Run directly with npx:

```bash
npx @desterlib/cli
```

Or install globally:

```bash
npm install -g @desterlib/cli
desterlib
```

## Quick Usage

```bash
# Run the setup wizard
npx @desterlib/cli
```

The wizard will ask:

1. 📚 **Media library path** - Where your movies/TV shows are
2. 🔌 **Server port** - Default is 3001
3. 🔒 **Database credentials** - Username and password

That's it! Your server will be installed in `~/.desterlib/`

## Commands

### `desterlib` or `desterlib setup`

Runs the interactive setup wizard.

**Options:**

- `--skip-docker-check` - Skip Docker installation verification (not recommended)

**Example:**

```bash
npx @desterlib/cli setup --skip-docker-check
```

## Configuration

### What Gets Created

The CLI creates these files in `~/.desterlib/`:

**1. docker-compose.yml** (~50 lines)

```yaml
services:
  postgres:
    image: postgres:15-alpine
    # Database configuration

  api:
    image: desterlib/api:latest
    # API server configuration
```

**2. .env** (~15 lines)

```env
# Required
DATABASE_URL=postgresql://...
METADATA_PATH=./desterlib-data/metadata
API_LOG_PATH=./desterlib-data/logs

# Optional
NODE_ENV=production
PORT=3001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

**3. README.md**
Quick reference with management commands.

### Installation Directory

| OS          | Location                   |
| ----------- | -------------------------- |
| macOS/Linux | `~/.desterlib`             |
| Windows     | `%USERPROFILE%\.desterlib` |

## Managing Your Installation

After setup, manage DesterLib from the installation directory:

```bash
cd ~/.desterlib

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down

# Update to latest
docker-compose pull
docker-compose up -d
```

## Reconfiguring

To update your configuration, run the CLI again:

```bash
npx @desterlib/cli
```

You'll be prompted to:

- **Reconfigure** - Update settings (overwrites config files)
- **Remove and start fresh** - Delete everything and reinstall
- **Cancel** - Keep current setup

## Existing Installation

If DesterLib is already installed, the CLI will:

1. Detect the existing installation
2. Offer to reconfigure or reinstall
3. Preserve your database unless you choose full reinstall

## Requirements

- **Docker** and **Docker Compose**
- **Node.js** 18+ (only for running the CLI via npx)

No Git or source code knowledge required!

## Troubleshooting

### Docker Not Found

```
❌ Docker is not installed or not running.
```

**Solution:**

- Install [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Make sure Docker is running (check system tray/menu bar)

### Docker Compose Not Available

```
❌ Docker Compose is not available
```

**Solution:**

- Docker Desktop includes Compose automatically
- Linux: `sudo apt install docker-compose-plugin`

### Port Already in Use

If port 3001 is taken:

1. During setup, choose a different port when prompted
2. Or kill the process using 3001:
   ```bash
   lsof -ti:3001 | xargs kill -9  # Mac/Linux
   ```

### Permission Errors

If you can't access your media path:

- Ensure the directory exists
- Check permissions: `ls -la /path/to/media`
- Choose a different directory during setup

## Advanced Usage

### Skip Docker Check

Not recommended, but you can skip the Docker check:

```bash
npx @desterlib/cli setup --skip-docker-check
```

### Custom Installation Directory

Currently, the CLI installs to `~/.desterlib`. To use a custom location, you'll need to manually set up using the [Manual Installation Guide](/getting-started/installation/#option-2-manual-setup-for-developers).

## Uninstalling

To completely remove DesterLib:

```bash
# Stop and remove containers
cd ~/.desterlib
docker-compose down -v  # -v removes database data

# Remove installation directory
cd ~
rm -rf .desterlib
```

:::caution
The `-v` flag removes Docker volumes, which deletes your database. Omit it if you want to keep your data.
:::

## For Developers

The CLI source code is in the monorepo:

```bash
# Clone the monorepo
git clone https://github.com/DesterLib/desterlib.git
cd desterlib/packages/cli

# Install dependencies
pnpm install

# Run in development mode
pnpm dev

# Build
pnpm build
```

See the [Contributing Guide](/development/contributing/) for more details.

## Related Documentation

- [Quick Start](/getting-started/quick-start/) - Get running in 5 minutes
- [Installation Guide](/getting-started/installation/) - Complete setup guide
- [Managing Your Server](/guides/managing-server/) - Server management commands
- [Updating DesterLib](/guides/updating/) - How to update to latest version
