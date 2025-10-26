# 🎬 DesterLib

**Your Personal Media Server** - Self-hosted media streaming for movies and TV shows.

[![GitHub](https://img.shields.io/badge/GitHub-DesterLib-blue?logo=github)](https://github.com/DesterLib/desterlib)
[![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
[![Documentation](https://img.shields.io/badge/docs-desterlib-blue)](https://desterlib.github.io/desterlib)

---

## What is DesterLib?

DesterLib is a modern, self-hosted media server that lets you:
- 📚 **Organize** your media collection automatically
- 🎞️ **Stream** movies and TV shows smoothly
- 📱 **Watch** on any device (mobile, desktop, TV)
- 🎨 **Beautiful UI** with automatic metadata and artwork

**Components:**
- **API Server** (this repo) - Backend for media management and streaming
- **Client Apps** - Mobile and desktop applications ([desterlib-flutter](https://github.com/DesterLib/desterlib-flutter))

---

## 🚀 Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/DesterLib/desterlib.git
cd desterlib

# Start all services
docker-compose up -d

# Access API: http://localhost:3001
# API Docs: http://localhost:3001/api/docs
```

### Development Setup

```bash
# Install dependencies
pnpm install

# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run API server
cd apps/api
pnpm dev
```

---

## 📚 Documentation

**📖 Full Documentation:** [desterlib.github.io/desterlib](https://desterlib.github.io/desterlib)

### Quick Links

- [Getting Started](https://desterlib.github.io/desterlib/getting-started/quick-start) - Installation and setup
- [API Server Guide](https://desterlib.github.io/desterlib/api/overview) - Backend development
- [Client Apps](https://desterlib.github.io/desterlib/clients/overview) - Mobile & desktop apps
- [Contributing](https://desterlib.github.io/desterlib/development/contributing) - How to contribute
- [API Docs](http://localhost:3001/api/docs) - Interactive API documentation (when running)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://desterlib.github.io/desterlib/development/contributing).

**Quick Start:**
```bash
# Fork, clone, and create branch
git checkout -b feat/your-feature

# Make changes with conventional commits
pnpm commit

# Add changeset for user-facing changes
pnpm changeset

# Push and create PR
git push origin feat/your-feature
```

**Resources:**
- [Contributing Guide](CONTRIBUTING.md) - Quick start
- [Commit Guidelines](https://desterlib.github.io/desterlib/development/commit-guidelines)
- [Versioning Guide](https://desterlib.github.io/desterlib/development/versioning)

---

## 🏗️ Project Structure

```
desterlib/
├── apps/
│   ├── api/          # Backend API (Node.js + TypeScript + Express)
│   └── docs/         # Documentation (Astro + Starlight)
└── packages/
    ├── eslint-config/       # Shared ESLint configuration
    └── typescript-config/   # Shared TypeScript configuration
```

---

## 📦 Features

- ✅ Automatic media scanning and organization
- ✅ TMDB metadata and artwork integration
- ✅ Video streaming with transcoding support
- ✅ Watch progress tracking
- ✅ REST API + WebSocket support
- ✅ Docker-ready deployment
- ✅ Cross-platform clients (Android, iOS, macOS, Linux, Windows)

---

## 💬 Support

- 📖 [Documentation](https://desterlib.github.io/desterlib)
- 🐛 [Report Issues](https://github.com/DesterLib/desterlib/issues)
- 💬 [Discussions](https://github.com/DesterLib/desterlib/discussions)

---

## 📄 License

GNU Affero General Public License v3.0 (AGPL-3.0)

This ensures the software remains free and open source forever. See [LICENSE](LICENSE) for details.

---

**Made with ❤️ by the DesterLib community**
