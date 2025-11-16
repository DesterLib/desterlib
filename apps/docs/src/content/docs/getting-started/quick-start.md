---
title: Quick Start
description: Get DesterLib running in 5 minutes
---

Get DesterLib streaming in 5 minutes! ⚡

## What You Need

- 🐳 Docker installed ([Get Docker](https://www.docker.com/products/docker-desktop))
- 📁 A folder with your media files
- 📱 A device to watch on

## Two Simple Steps

### 1. Install the Server

**macOS/Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/DesterLib/desterlib/main/packages/cli/install.sh | bash
```

**Windows (PowerShell):**

```powershell
iwr -useb https://raw.githubusercontent.com/DesterLib/desterlib/main/packages/cli/install.ps1 | iex
```

The installer will automatically install Node.js if needed, then install the CLI.

The wizard will ask you 3 quick questions:

- 📚 Where are your media files?
- 🔌 What port to use? (default: 3001)
- 🔒 Database password

That's it! Your server will be running at `http://localhost:3001`

:::tip[What just happened?]
The CLI downloaded everything needed and started your media server in `~/.desterlib/`
:::

### 2. Install the Client App

**Download for your device:**

📥 [Get the Latest Release](https://github.com/DesterLib/Dester-Flutter/releases/latest)

- Android: `Dester-*-Android-arm64-v8a.apk`
- macOS: `Dester-*-macOS.dmg`
- Windows/Linux: Check the releases page

**Then:**

1. Open the app
2. Enter `http://YOUR_SERVER_IP:3001`
3. Go to Settings → Scan Library
4. Start watching! 🎉

:::note[Finding Your Server IP]

- Same device: Use `http://localhost:3001`
- Different device: Find your IP with `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
  :::

## That's It!

You're done! Browse your movies and TV shows.

---

**Need more help?**

- 📖 [Full Installation Guide](/getting-started/installation/) - Detailed setup, troubleshooting, and client builds
- 🔧 [Managing Your Server](/getting-started/installation/#managing-your-server) - Start, stop, update commands
- 🐛 [Troubleshooting](/getting-started/installation/#troubleshooting) - Common issues and fixes
- 💻 [Contributing](/development/contributing/) - Want to help build DesterLib?
