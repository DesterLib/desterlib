---
title: Installation Guide
description: Complete installation guide for DesterLib server and clients
---

Complete guide for installing and configuring DesterLib.

:::tip[Just want to get started quickly?]
See the [Quick Start Guide](/getting-started/quick-start/) for a 5-minute setup!
:::

## System Requirements

### Server

- **CPU**: 2 cores minimum
- **RAM**: 2GB minimum
- **Storage**: Your media collection size + 10GB
- **OS**: Linux, macOS, or Windows
- **Docker**: Version 20.10 or higher

### Client Devices

- Android 5.0+, iOS 12+, macOS 10.15+, Windows 10+, or Linux

## Server Installation

### Option 1: CLI Setup (Recommended)

**Perfect for:** End users who want it working fast

```bash
npx @desterlib/cli
```

The interactive wizard will guide you through:

1. Media library location
2. Server port (default: 3001)
3. Database credentials

Your server will be installed in `~/.desterlib/` and started automatically.

**Verify it's working:**

```bash
curl http://localhost:3001/health
# Should return: {"status":"ok",...}
```

### Option 2: Manual Setup (For Developers)

**Perfect for:** Contributors and advanced users

```bash
# 1. Clone the repository
git clone https://github.com/DesterLib/desterlib.git
cd desterlib

# 2. Start with Docker Compose
docker-compose up -d

# 3. Access at http://localhost:3001
```

**Optional:** Customize with `.env` file in `apps/api/`:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/desterlib
NODE_ENV=production
PORT=3001
```

## Client Installation

### Pre-built Apps

📥 **[Download from Releases](https://github.com/DesterLib/Dester-Flutter/releases/latest)**

:::caution[Alpha Software]
DesterLib is in alpha. Expect bugs and frequent updates!
:::

**Available platforms:**

| Platform             | File                             |
| -------------------- | -------------------------------- |
| Android Phone/Tablet | `Dester-*-Android-arm64-v8a.apk` |
| Android TV           | `Dester-*-AndroidTV-arm64.apk`   |
| macOS                | `Dester-*-macOS.dmg`             |
| Windows              | `Dester-*-Windows-x64.zip`       |
| Linux                | `Dester-*-Linux-x64.tar.gz`      |
| iOS                  | Build from source (see below)    |

**After installing:**

1. Open the app
2. Enter: `http://YOUR_SERVER_IP:3001`
3. Scan Library from Settings
4. Start watching!

### Build from Source

For iOS or if you prefer building yourself:

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

## Managing Your Server

Commands depend on your installation method:

**If installed via CLI:**

```bash
cd ~/.desterlib

docker-compose ps       # View status
docker-compose logs -f  # View logs
docker-compose restart  # Restart
docker-compose down     # Stop
docker-compose pull && docker-compose up -d  # Update
```

**If installed via Git:**

```bash
cd desterlib

docker ps               # View status
docker-compose logs -f  # View logs
docker-compose restart  # Restart
docker-compose down     # Stop
git pull && docker-compose up -d --build  # Update
```

## Development Setup

For contributors who want to modify the code:

```bash
# 1. Clone and install
git clone https://github.com/DesterLib/desterlib.git
cd desterlib
pnpm install

# 2. Start test database
docker-compose -f docker-compose.test.yml up -d

# 3. Configure .env in apps/api/
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/desterlib_test
NODE_ENV=development
PORT=3001

# 4. Run the API
cd apps/api
pnpm db:generate
pnpm db:push
pnpm dev
```

See [Contributing Guide](/development/contributing/) for more details.

## Remote Access

To access from outside your network:

**Option 1: Port Forwarding**

- Forward port 3001 on your router
- Use dynamic DNS (e.g., DuckDNS, No-IP)

**Option 2: Tunneling (Easier)**

- [Tailscale](https://tailscale.com/) (recommended)
- [ngrok](https://ngrok.com/): `ngrok http 3001`
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

:::caution[Security]
If exposing to internet, use HTTPS and enable authentication!
:::

## Maintenance

### Database Backup

```bash
docker exec -t desterlib-postgres pg_dump -U desterlib desterlib > backup.sql
```

### Database Restore

```bash
cat backup.sql | docker exec -i desterlib-postgres psql -U desterlib desterlib
```

### Uninstall

**CLI installation:**

```bash
cd ~/.desterlib && docker-compose down -v
rm -rf ~/.desterlib
```

**Git installation:**

```bash
cd desterlib && docker-compose down -v
cd .. && rm -rf desterlib
```

## Troubleshooting

### Server Won't Start

**Port already in use:**

```bash
# Find and kill process using port 3001
lsof -ti:3001 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :3001   # Windows
```

**Check logs:**

```bash
cd ~/.desterlib  # or your install directory
docker-compose logs -f
```

**Full reset:**

```bash
cd ~/.desterlib
docker-compose down -v
docker-compose up -d
```

### Can't Connect from Client

**Checklist:**

1. Server running? → `docker ps | grep desterlib`
2. Test connection → `curl http://SERVER_IP:3001/health`
3. Find server IP:
   - macOS/Linux: `ifconfig | grep "inet "`
   - Windows: `ipconfig`
4. Check firewall → Allow port 3001
5. Use IP not hostname → `192.168.1.100:3001` not `my-computer:3001`

### Movies Not Showing

**Steps:**

1. Scan library → Settings → Library Management → Scan Library
2. Check media mounted → Verify path in `~/.desterlib/docker-compose.yml`
3. File naming → Use `Movie Name (2023).mp4` format
4. Check logs → `docker-compose logs -f api` for errors
5. Verify TMDB key → Set in app Settings if not already configured

### Build Issues (Development)

```bash
# API
pnpm clean && rm -rf node_modules && pnpm install

# Flutter
flutter clean && flutter pub get
```

## Need Help?

- 📖 [Quick Start](/getting-started/quick-start/) - 5-minute setup guide
- 🔧 [API Documentation](http://localhost:3001/api/docs) - Full API reference
- 💬 [GitHub Discussions](https://github.com/DesterLib/desterlib/discussions) - Ask questions
- 🐛 [Report Issues](https://github.com/DesterLib/desterlib/issues) - Bug reports
