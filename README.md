# 🎬 DesterLib

**Your Personal Media Server** - Watch your movies and TV shows from anywhere. It's like Netflix, but for YOUR personal collection!

[![GitHub](https://img.shields.io/badge/GitHub-DesterLib-blue?logo=github)](https://github.com/DesterLib/desterlib)
[![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

---

## What is DesterLib?

DesterLib is a modern, self-hosted media server system that lets you:
- 📚 **Organize** your media collection automatically
- 🎞️ **Stream** movies and TV shows smoothly
- 📱 **Watch** on any device (Android, iOS, macOS, Linux, Windows)
- ⚙️ **Control** your entire media library from one place

---

## Quick Start

### Prerequisites
- Docker installed
- Node.js 18+ and pnpm (for development)
- Your media files

### Development Setup

```bash
# Clone the repository
git clone https://github.com/DesterLib/desterlib.git
cd desterlib

# Start test database
docker-compose -f docker-compose.test.yml up -d

# Install dependencies and run
pnpm install
cd apps/api
pnpm dev
```

Access the API at `http://localhost:3001`

### Production Setup

```bash
# Start all services with Docker
docker-compose up -d
```

---

## 📚 Documentation

**Full documentation is available at: http://localhost:4321**

To run the docs locally:
```bash
cd apps/docs
pnpm dev
```

### Quick Links

- 📥 [Download Flutter App](https://github.com/DesterLib/Dester-Flutter/releases/latest) - Get the alpha client app
- 🚀 [Quick Start Guide](http://localhost:4321/getting-started/quick-start/) - Get up and running
- 📦 [Installation Guide](http://localhost:4321/getting-started/installation/) - Detailed setup
- 🏗️ [Project Structure](http://localhost:4321/development/structure/) - Code organization
- 📋 [Versioning Guide](http://localhost:4321/development/versioning/) - Contributing
- 💻 [Commit Guidelines](http://localhost:4321/development/commit-guidelines/) - Commit format
- 🔗 [API Documentation](http://localhost:3001/api/docs) - When API is running

---

## Contributing

We welcome contributions from the community! 🎉

### Quick Start for Contributors

```bash
# Fork the repo, then:
git clone https://github.com/YOUR-USERNAME/desterlib.git
cd desterlib

# Install dependencies
pnpm install

# Create feature branch
git checkout -b feat/your-feature

# Make changes and commit
pnpm commit

# Add changeset for user-facing changes
pnpm changeset

# Push and create PR
git push origin feat/your-feature
```

### Branching Strategy

- `main` → Production releases (tagged)
- `dev` → Development (merge PRs here)
- `feat/*` → New features
- `fix/*` → Bug fixes
- `docs/*` → Documentation updates

### Resources

- 📖 **[Contributing Guide](CONTRIBUTING.md)** - Complete contribution instructions
- 💻 **[Commit Guidelines](http://localhost:4321/development/commit-guidelines/)** - Commit message format
- 🦋 **[Versioning Guide](http://localhost:4321/development/versioning/)** - Changesets workflow
- 📋 **[Quick Reference](http://localhost:4321/development/quick-reference/)** - Common commands

**Before submitting a PR:**
1. Use conventional commits: `pnpm commit`
2. Add changeset: `pnpm changeset` (if needed)
3. Ensure tests pass: `pnpm lint && pnpm check-types`
4. Fill out the PR template completely

---

## Project Structure

```
desterlib/
├── apps/
│   ├── api/          # Backend API (Express + TypeScript)
│   └── docs/         # Documentation site (Starlight)
├── packages/
│   ├── eslint-config/       # Shared ESLint config
│   └── typescript-config/   # Shared TypeScript config
└── .changeset/       # Version management
```

---

## Key Features

✅ Automatic media scanning and organization  
✅ Smooth video streaming  
✅ Multi-device support  
✅ REST API with WebSocket support  
✅ Docker-ready deployment  
✅ Cross-platform (Android, iOS, Desktop)

---

## Get Help

- 📖 [Documentation](http://localhost:4321)
- 🐛 [Report Issues](https://github.com/DesterLib/desterlib/issues)
- 💬 [Discussions](https://github.com/DesterLib/desterlib/discussions)

---

## License

**GNU Affero General Public License v3.0 (AGPL-3.0)**

DesterLib is free and open source software licensed under AGPL-3.0. This ensures:
- The software remains free forever
- All modifications must be open source
- Network use requires source code sharing
- No proprietary forks allowed

See [LICENSE](LICENSE) for full details.

---

**Happy watching! 🎉**
