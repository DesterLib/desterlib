---
title: Quick Start
description: Get DesterLib up and running in minutes
---

Get DesterLib streaming your media in just a few minutes!

## Prerequisites

- **Docker** installed ([Get Docker](https://www.docker.com/products/docker-desktop))
- A folder with your movies/TV shows
- Your phone/tablet/computer to watch on

## Setup in 2 Steps 🚀

### Step 1: Start the Server

```bash
# Clone the repository
git clone https://github.com/DesterLib/desterlib.git
cd desterlib

# Start everything with Docker
docker-compose up -d
```

That's it! Docker will:
- 🐘 Start a PostgreSQL database
- 🔧 Build and run the API
- 📁 Set up your media server

The server will be running at `http://localhost:3001`

### Step 2: Connect with Flutter App

1. **Download the Flutter app** on your device:
   
   📥 **[Download Latest Alpha Build](https://github.com/DesterLib/Dester-Flutter/releases/latest)**
   
   ⚠️ **Alpha Release**: DesterLib is currently in alpha. Expect bugs and frequent updates!
   
   Choose your platform:
   - **Android (Phone/Tablet)**: `Dester-*-Android-arm64-v8a.apk`
   - **Android TV**: `Dester-*-AndroidTV-arm64.apk`
   - **macOS**: `Dester-*-macOS.dmg` or `.zip`
   - **Linux**: `Dester-*-Linux-x64.tar.gz`
   - **Windows**: `Dester-*-Windows-x64.zip`
   - **iOS**: Build from source (App Store coming soon)
   
   Or [build from source](https://github.com/DesterLib/Dester-Flutter#readme) if you prefer

2. **Configure the app**:
   - Open the app
   - Enter your server address: `http://YOUR_IP:3001`
     - For same device: `http://localhost:3001`
     - For network: `http://192.168.1.XXX:3001` (your server's IP)
   - The app will connect to your server

3. **Scan your media library:**
   - Go to Settings in the app
   - Navigate to Library Management
   - Tap "Scan Library" to index your media files
   - Wait for the scan to complete

4. **Start watching!** 🎉
   - Browse your movies and TV shows
   - Tap to play
   - Enjoy your personal streaming service

## Access Points

- **Server API**: `http://localhost:3001`
- **API Documentation**: `http://localhost:3001/api/docs`
- **Health Check**: `http://localhost:3001/health`

## For Developers

If you want to develop and contribute, see the [Development Setup](#development-setup) below.

### Development Setup

This setup runs only the database in Docker, while you run the API with pnpm for fast development:

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Install dependencies
pnpm install

# Configure environment (.env in apps/api/)
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/desterlib_test
NODE_ENV=development
PORT=3001

# Run the API
cd apps/api
pnpm dev
```

Access at `http://localhost:3001`

## Troubleshooting

### Can't connect from mobile app

- Make sure the server is running: `docker ps`
- Use your server's IP address, not `localhost` (unless on same device)
- Check your firewall allows connections on port 3001
- Ensure both devices are on the same network

### Movies aren't showing up

- Make sure you've scanned your library from the Flutter app (Settings → Library Management → Scan Library)
- Check that your media folder is properly mounted in `docker-compose.yml`
- Verify file naming follows standard formats (e.g., `Movie Name (2023).mp4`)
- Check scan status in the app

### Server won't start

- Check if port 3001 is already in use
- Verify Docker is running: `docker ps`
- Check logs: `docker logs desterlib-api`

### Reset everything

```bash
docker-compose down -v
docker-compose up -d
```

## Next Steps

- [Full Installation Guide](/getting-started/installation/) for detailed setup and mobile app builds
- [API Documentation](http://localhost:3001/api/docs) to explore all endpoints
- [Project Structure](/development/structure/) if you want to contribute

