---
title: Installation Guide
description: Complete installation guide for DesterLib server and clients
---

This guide covers complete installation for both the server and client applications.

## System Requirements

### Server Requirements
- **CPU**: 2 cores minimum
- **RAM**: 2GB minimum
- **Storage**: Your media collection size + 10% extra
- **OS**: Linux, macOS, or Windows with Docker support
- **Network**: Local network or internet access for remote streaming

### Software Requirements
- **Docker** 20.10 or higher
- **Node.js** 18+ and **pnpm** 9.0+ (only for development)

## Part 1: Server Installation

### Docker Setup (Recommended)

**Best for:** Everyone - simplest way to get started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DesterLib/desterlib.git
   cd desterlib
   ```

2. **Start the server:**
   ```bash
   docker-compose up -d
   ```

3. **Verify server is running:**
   ```bash
   curl http://localhost:3001/health
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

That's it! Your server is ready. Now install the client app to scan your library and start watching.

### Optional: Environment Configuration

To customize settings, create `.env` in `apps/api/`:

```bash
# Database (uses default Docker settings)
DATABASE_URL=postgresql://postgres:postgres@db:5432/desterlib

# Server
NODE_ENV=production
PORT=3001

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Part 2: Client Installation

### Quick Download (Recommended)

📥 **[Download Latest Alpha Build](https://github.com/DesterLib/Dester-Flutter/releases/latest)**

⚠️ **Alpha Release**: DesterLib is currently in alpha development. Expect bugs, missing features, and frequent updates!

Choose your platform:
- **Android (Phone/Tablet)**: Download `Dester-*-Android-arm64-v8a.apk` and install
- **Android TV**: Download `Dester-*-AndroidTV-arm64.apk` for TV with remote support  
- **macOS**: Download `Dester-*-macOS.dmg` and drag to Applications
- **Linux**: Download `Dester-*-Linux-x64.tar.gz` and extract
- **Windows**: Download `Dester-*-Windows-x64.zip` and extract
- **iOS**: See [Building from Source](#building-from-source) below

:::tip
The `*` in filenames represents the version number (e.g., `v0.1.0-alpha`).
Download the file matching your platform from the latest release.
:::

After installing:
1. Open the app
2. Enter server address: `http://YOUR_SERVER_IP:3001`
3. Go to Settings → Library Management
4. Tap "Scan Library" to index your media
5. Start browsing and streaming!

### Building from Source

If you prefer to build from source or need iOS builds:

#### Android

1. **Clone the Flutter app repository:**
   ```bash
   git clone https://github.com/DesterLib/Dester-Flutter.git
   cd Dester-Flutter
   ```

2. **Install Flutter dependencies:**
   ```bash
   flutter pub get
   ```

3. **Build and install APK:**
   ```bash
   # Build APK
   flutter build apk --release
   
   # APK will be at: build/app/outputs/flutter-apk/app-release.apk
   # Transfer to your Android device and install
   
   # Or install directly if device is connected:
   flutter install
   ```

#### iOS

1. **Prerequisites:**
   - macOS with Xcode installed
   - Apple Developer account (for device deployment)

2. **Clone and setup:**
   ```bash
   git clone https://github.com/DesterLib/Dester-Flutter.git
   cd Dester-Flutter
   flutter pub get
   ```

3. **Install CocoaPods dependencies:**
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Open in Xcode:**
   ```bash
   open ios/Runner.xcworkspace
   ```

5. **Build and run:**
   - Select your device or simulator in Xcode
   - Click Run (▶️) button
   - Or use: `flutter run`

#### Desktop Platforms

**macOS:**
```bash
git clone https://github.com/DesterLib/Dester-Flutter.git
cd Dester-Flutter
flutter pub get
flutter build macos --release

# App will be at: build/macos/Build/Products/Release/Dester.app
```

**Linux:**
```bash
# Install dependencies first
sudo apt-get install clang cmake ninja-build pkg-config libgtk-3-dev liblzma-dev libmpv-dev mpv

git clone https://github.com/DesterLib/Dester-Flutter.git
cd Dester-Flutter
flutter pub get
flutter build linux --release

# Binary will be at: build/linux/x64/release/bundle/
```

**Windows:**
```bash
git clone https://github.com/DesterLib/Dester-Flutter.git
cd Dester-Flutter
flutter pub get
flutter build windows --release

# App will be at: build/windows/x64/runner/Release/
```

## Part 3: Connecting Everything

### Finding Your Server IP

**On the server machine:**

```bash
# macOS/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

Look for your local IP (usually starts with `192.168.x.x` or `10.0.x.x`)

### Configure Client App

1. Open the mobile/desktop app
2. Go to Settings or initial setup
3. Enter: `http://YOUR_SERVER_IP:3001`
   - Example: `http://192.168.1.100:3001`
   - If on same machine: `http://localhost:3001`
4. Save and connect

### Test Connection

From the client device, test if the server is reachable:

```bash
# Replace with your server IP
curl http://192.168.1.100:3001/health
```

Should return:
```json
{"status": "ok", "timestamp": "..."}
```

## Advanced Setup

### For Developers

If you want to develop and contribute:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DesterLib/desterlib.git
   cd desterlib
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start test database:**
   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

4. **Configure environment** (`.env` in `apps/api/`):
   ```bash
   DATABASE_URL=postgresql://postgres:postgres@localhost:5433/desterlib_test
   NODE_ENV=development
   PORT=3001
   ```

5. **Run the API:**
   ```bash
   cd apps/api
   pnpm db:generate
   pnpm db:push
   pnpm dev
   ```

6. **Run the docs (optional):**
   ```bash
   cd apps/docs
   pnpm dev
   ```

### Remote Access Setup

To access your server from outside your home network:

1. **Port Forwarding:**
   - Forward port 3001 on your router to your server
   - Use your public IP or a dynamic DNS service

2. **Security (Recommended):**
   - Set up HTTPS with Let's Encrypt
   - Use a reverse proxy (nginx/Caddy)
   - Enable authentication

3. **Or use tunneling services:**
   - ngrok: `ngrok http 3001`
   - Cloudflare Tunnel
   - Tailscale

## Maintenance

### Updating Server

```bash
cd desterlib
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
```

### Updating Client Apps

Rebuild from source using the same installation steps.

### Backup Database

```bash
docker exec -t desterlib-db pg_dump -U postgres desterlib > backup.sql
```

### Restore Database

```bash
cat backup.sql | docker exec -i desterlib-db psql -U postgres desterlib
```

### View Logs

```bash
# Server logs
docker logs desterlib-api

# Follow logs
docker logs -f desterlib-api

# Database logs
docker logs desterlib-db
```

## Uninstallation

### Remove Server

```bash
cd desterlib
docker-compose down -v  # -v removes volumes (database data)
cd ..
rm -rf desterlib
```

### Remove Client Apps

- **Android/iOS:** Uninstall like any other app
- **Desktop:** Delete the app from Applications/Programs folder

## Troubleshooting

### Server Issues

**Port already in use:**
```bash
# Change port in docker-compose.yml or .env
PORT=3002
```

**Server won't start:**
```bash
# Check logs
docker logs desterlib-api

# Restart containers
docker-compose restart

# Full reset
docker-compose down -v
docker-compose up -d
```

**Database connection failed:**
```bash
# Check if database is running
docker ps | grep postgres

# Restart database
docker-compose restart db
```

### Client Connection Issues

**Can't connect to server:**
- Verify server is running: `docker ps`
- Test connection: `curl http://YOUR_IP:3001/health`
- Check firewall settings
- Ensure both devices are on same network
- Try using server's IP instead of hostname

**Movies not showing:**
- Scan your library from the Flutter app (Settings → Library Management → Scan Library)
- Check media folder is mounted in `docker-compose.yml`
- Verify file naming (e.g., `Movie Name (2023).mp4`)
- Check scan status in the app or API logs for errors

**Slow streaming:**
- Check network bandwidth
- Reduce video quality in app settings
- Consider transcoding large files
- Ensure server has adequate resources

### Build Issues (Development)

```bash
# Clear caches
pnpm clean
rm -rf node_modules
pnpm install

# Flutter issues
cd desterlib-flutter
flutter clean
flutter pub get
```

### Permission Issues

**Docker permission denied:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or:
newgrp docker
```

## Version Information

### Current Limitation
⚠️ **Known Issue**: The app version shown in Settings currently doesn't match the release tag. For example, a `v1.0.0` release might still show `0.1.1` internally. This will be fixed in future releases. Check the release page or filename for the actual version.

### Checking Your Version
- **Release filename**: Check the downloaded file name (e.g., `Dester-v1.0.0-alpha.1-Android-arm64.apk`)
- **GitHub Release page**: [View all releases](https://github.com/DesterLib/Dester-Flutter/releases)
- **In-app** (currently shows dev version): Settings → About

## Next Steps

- 🎬 Start watching your media!
- 📖 Explore the [API Documentation](http://localhost:3001/api/docs)
- 🛠️ [Project Structure](/development/structure/) if you want to contribute
- 🔄 [Versioning Guide](/development/versioning/) for contribution guidelines
- ❓ [Quick Start](/getting-started/quick-start/) for a faster overview

