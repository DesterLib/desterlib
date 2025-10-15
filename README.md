# Dester

A media library management system for organizing and streaming your movies, TV shows, music, and comics.

## Project Structure

This is a monorepo managed with pnpm workspaces and Turborepo.

```
desterlib/
├── apps/
│   ├── api/          # Express.js API server with Prisma ORM
│   └── web/          # React web frontend
└── packages/
    ├── api-client/   # TypeScript API client library
    ├── eslint-config/ # Shared ESLint configurations
    └── typescript-config/ # Shared TypeScript configurations
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose (for database)

### Quick Start

```bash
# Option 1: Automated setup (recommended)
./setup-dev.sh

# Option 2: Manual setup
# 1. Start PostgreSQL and Redis
docker-compose -f docker-compose.dev.yml up -d

# 2. Setup database
cd apps/api
cp .env.local .env.local
pnpm install
pnpm db:generate
pnpm db:migrate

# 3. Start API
pnpm dev
```

### Development Commands

```bash
# Start API in development mode
cd apps/api
pnpm dev

# Database commands
pnpm db:migrate      # Create and run migration
pnpm db:studio       # Open Prisma Studio
pnpm db:generate     # Generate Prisma Client

# Testing
pnpm test            # Run tests
pnpm test:coverage   # Run with coverage

# Build
pnpm build           # Build for production
pnpm start           # Start production build

# Type checking
pnpm check-types
```

### Docker Deployment

```bash
# Production (full stack)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

## Features

- 📁 **Media Scanning**: Automatically scan directories for media files
- 🎬 **Movies & TV Shows**: Organized library with metadata from TMDB
- 🎵 **Music**: Audio library support
- 📚 **Comics**: Comic book library management
- 🔍 **Search**: Full-text search across all media
- 📊 **Collections**: Organize media into custom collections
- 🎥 **Streaming**: Direct media streaming support
- ⚙️ **Settings**: Configurable TMDB API integration

## API Documentation

The API includes built-in Swagger documentation available at `/api-docs` when running the server.

## License

MIT
