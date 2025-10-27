---
title: Platform Setup
description: Platform-specific setup and development guide for the Dester client
---

The Dester client is a cross-platform application for browsing and streaming your DesterLib media collection. This guide covers platform-specific setup and development.

## 📱 Supported Platforms

### Available Now
- **Android** - Phones and tablets (SDK 21+)
- **iOS** - iPhone and iPad (iOS 12.0+)
- **macOS** - Desktop application (10.14+)
- **Linux** - Desktop application (Ubuntu 20.04+)
- **Windows** - Desktop application (Windows 10+)

### In Development
- **Android TV** - TV interface with remote control support
- **Apple TV / tvOS** - Native TV experience

## 🚀 Getting Started

### Prerequisites

- Flutter SDK 3.9.2 or higher
- DesterLib API server running
- Platform-specific development tools (Android Studio, Xcode, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/DesterLib/desterlib-flutter.git
cd desterlib-flutter

# Install dependencies
flutter pub get

# Generate code
dart run build_runner build --delete-conflicting-outputs

# Run the app
flutter run
```

### Server Configuration

On first launch, configure your DesterLib API server:

1. Open **Settings** → **Server Configuration**
2. Enter your server URL:
   - Local: `http://localhost:3001`
   - Network: `http://192.168.1.XXX:3001`
   - Remote: `https://yourdomain.com`
3. Save and the app will connect automatically

## 🏗️ Architecture

### Tech Stack

The client is built with Flutter, providing native performance across all platforms:

- **Flutter SDK** - Cross-platform UI framework
- **Riverpod** - State management
- **go_router** - Navigation and routing
- **media_kit** - Video playback
- **OpenAPI** - Auto-generated API client

### Project Structure

```
lib/
├── main.dart              # App entry point
├── app/
│   ├── router.dart        # Navigation configuration
│   ├── theme/             # App theming
│   └── providers.dart     # Global providers
├── features/              # Feature modules
│   ├── home/              # Home screen
│   ├── library/           # Library browsing
│   ├── media/             # Media detail pages
│   └── settings/          # Settings and configuration
├── shared/
│   ├── widgets/           # Reusable UI components
│   ├── utils/             # Utility functions
│   └── providers/         # Shared state providers
└── api/                   # Generated API client
```

## 🎨 Features

### Media Browsing

- Browse movies and TV shows
- Search functionality
- Filter by genre, year, rating
- Sort options
- Grid and list views

### Video Player

- Smooth streaming playback
- Playback controls (play, pause, seek)
- Volume control
- Fullscreen support
- Playback speed adjustment
- Subtitle support (coming soon)
- Audio track selection (coming soon)

### Watch Progress

- Automatic progress tracking
- Resume from where you left off
- Mark as watched/unwatched
- Watch history

### Settings

- Server configuration
- Theme selection (light/dark)
- Playback preferences
- Cache management
- About and version info

## 🔧 Development

### Contributing

See the [contributing guide](https://github.com/DesterLib/desterlib-flutter/blob/main/CONTRIBUTING.md) for development setup.

All contribution guidelines (commits, versioning, etc.) follow the main DesterLib standards documented in this site.

### Building for Release

#### Android

```bash
# APK
flutter build apk --release

# App Bundle (for Play Store)
flutter build appbundle --release
```

#### iOS

```bash
# Build for iOS
flutter build ios --release

# Open in Xcode for deployment
open ios/Runner.xcworkspace
```

#### Desktop

```bash
# macOS
flutter build macos --release

# Linux
flutter build linux --release

# Windows
flutter build windows --release
```

### Testing

```bash
# Run all tests
flutter test

# Run tests with coverage
flutter test --coverage

# Run specific test file
flutter test test/features/player_test.dart
```

### Code Quality

```bash
# Analyze code
flutter analyze

# Format code
dart format lib/

# Run linter
flutter analyze --fatal-infos
```

## 🎯 Roadmap

### Current Focus

- [ ] **TV Platform Support** - Android TV and Apple TV
- [ ] **Subtitle Support** - SRT, VTT formats
- [ ] **Audio Track Selection** - Multiple audio streams
- [ ] **Offline Downloads** - Save for offline viewing

### Future Plans

- [ ] **Chromecast** - Cast to any TV
- [ ] **Picture-in-Picture** - Watch while using other apps
- [ ] **Widgets** - Quick access shortcuts
- [ ] **Multi-User Profiles** - Separate watch history
- [ ] **Parental Controls** - Content restrictions

## 📱 Platform-Specific Notes

### Android

- Minimum SDK: 21 (Android 5.0)
- Target SDK: 34 (Android 14)
- Uses ExoPlayer for video playback

### iOS

- Minimum version: iOS 12.0
- Uses AVPlayer for video playback
- Requires Xcode 14+ for building

### macOS

- Minimum version: macOS 10.14
- Requires code signing for distribution

### Linux

- Tested on Ubuntu 20.04+, Fedora 36+
- Requires GTK 3.0

### Windows

- Minimum version: Windows 10
- Uses Windows Media Foundation

## 🐛 Troubleshooting

### Connection Issues

**Can't connect to server:**
- Check server URL is correct
- Ensure API is running (`docker-compose up`)
- Check firewall settings
- Try using IP address instead of localhost

### Video Playback Issues

**Videos won't play:**
- Check internet connection
- Verify video codec support
- Try different video file
- Check server streaming configuration

**Buffering issues:**
- Check network speed
- Adjust video quality in settings
- Check server performance

### Build Issues

**Flutter build fails:**
```bash
# Clean and rebuild
flutter clean
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run
```

**Platform-specific build issues:**
- Android: Check SDK version, update Gradle
- iOS: Update Xcode, check provisioning profiles
- Desktop: Check platform dependencies installed

## 📚 Resources

- [Client GitHub Repository](https://github.com/DesterLib/desterlib-flutter)
- [Flutter Documentation](https://flutter.dev/docs)
- [Riverpod Documentation](https://riverpod.dev)
- [media_kit Documentation](https://github.com/media-kit/media-kit)
- [Effective Dart](https://dart.dev/guides/language/effective-dart)

## 💬 Support

- [GitHub Issues](https://github.com/DesterLib/desterlib-flutter/issues)
- [GitHub Discussions](https://github.com/DesterLib/desterlib-flutter/discussions)
- [Main DesterLib Discussions](https://github.com/DesterLib/desterlib/discussions)

