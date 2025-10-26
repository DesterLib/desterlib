---
title: Client Applications
description: Overview of DesterLib client applications
---

The DesterLib client is a cross-platform application that connects to your DesterLib API Server, allowing you to browse and stream your media library across different platforms and devices.

## What is the Client?

The client provides:
- **Media Browsing** - Explore your movies and TV shows
- **Video Streaming** - Watch your content with smooth playback
- **Watch Progress** - Automatic progress tracking across devices
- **Search & Filter** - Find content quickly
- **Multi-Platform** - Works on mobile, desktop, and TV (coming soon)

**Repository**: [desterlib-flutter](https://github.com/DesterLib/desterlib-flutter)

## Supported Platforms

### 📱 Mobile
- **Android** - Phones and tablets
- **iOS** - iPhone and iPad

### 💻 Desktop
- **macOS** - Native desktop application
- **Linux** - Native desktop application
- **Windows** - Native desktop application

### 📺 TV (In Development)
- **Android TV** - TV interface with remote control
- **Apple TV / tvOS** - Native TV experience

**Repository**: [desterlib-flutter](https://github.com/DesterLib/desterlib-flutter)

[Learn more about platform-specific setup →](/clients/flutter)

## Features

The Dester client provides a unified experience across all platforms:

- **Media Library Browsing** - Browse movies and TV shows
- **Video Streaming** - Smooth playback with adaptive quality
- **Watch Progress** - Automatic tracking and resume
- **Search & Filter** - Find content quickly
- **Multi-Device Sync** - Progress syncs across devices
- **Offline Viewing** - Download for offline playback (coming soon)
- **System Integration** - Native look and feel on each platform
- **Chromecast Support** - Cast to TV (coming soon)

## API Compatibility

The client communicates with the DesterLib API using REST API and WebSocket connections.

### Version Compatibility

| Platform | Min API Version | Recommended API Version |
|----------|----------------|------------------------|
| All Platforms | 0.1.0+ | Latest |

:::caution
Keep your client updated to match your API version for the best experience and latest features.
:::

## Development

### Contributing

See the [contributing guide](https://github.com/DesterLib/desterlib-flutter/blob/main/CONTRIBUTING.md) for client-specific development setup and workflows.

:::tip
The client follows the same [DesterLib contribution guidelines](/development/contributing) as all other projects:
- Commit conventions
- Version management
- Code review process
- Documentation standards
:::

### Platform-Specific Development

Platform-specific setup and requirements:
- **Android**: Android Studio, Android SDK 21+
- **iOS**: Xcode 14+, iOS 12.0+
- **macOS**: Xcode, macOS 10.14+
- **Linux**: GTK 3.0, tested on Ubuntu 20.04+
- **Windows**: Visual Studio 2019+, Windows 10+
- **Android TV**: Android TV SDK (in development)
- **Apple TV**: tvOS SDK (planned)

### Building from Source

Check out the [platform-specific setup guide](/clients/flutter) for detailed build instructions.

## Platform Feature Status

| Feature | Mobile | Desktop | TV |
|---------|--------|---------|-----|
| Browse Library | ✅ | ✅ | 🔜 |
| Stream Videos | ✅ | ✅ | 🔜 |
| Search | ✅ | ✅ | 🔜 |
| Watch Progress | ✅ | ✅ | 🔜 |
| Offline Downloads | 🔜 | 🔜 | ❌ |
| Chromecast | 🔜 | 🔜 | N/A |
| Picture-in-Picture | 🔜 | 🔜 | N/A |
| System Integration | ✅ | ✅ | ✅ |
| Remote Control | Touch | KB/Mouse | 🔜 |

Legend: ✅ Available | 🔜 Planned | ❌ Not Available

## Requesting Features

Have an idea for a new feature or platform support?

1. Check existing [feature requests](https://github.com/DesterLib/desterlib/discussions/categories/ideas)
2. Search [client issues](https://github.com/DesterLib/desterlib-flutter/issues)
3. Create a new discussion or issue
4. Consider contributing! See our [contributing guide](/development/contributing)

## Support

Need help?

- **General questions**: [GitHub Discussions](https://github.com/DesterLib/desterlib/discussions)
- **Bug reports**: [Client Issues](https://github.com/DesterLib/desterlib-flutter/issues)
- **Feature requests**: [Ideas Discussion](https://github.com/DesterLib/desterlib/discussions/categories/ideas)

