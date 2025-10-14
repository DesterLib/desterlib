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

### Installation

```bash
# Install dependencies
pnpm install

# Run database migrations
cd apps/api && pnpm prisma migrate dev

# Start development servers
pnpm dev
```

### Development

```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm --filter api dev
pnpm --filter web dev

# Build all packages
pnpm build

# Type checking
pnpm check-types
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
