---
title: Project Structure
description: Understanding the DesterLib codebase organization
---

This guide explains how the DesterLib codebase is organized across the monorepo.

## Repository Overview

DesterLib is organized as a **pnpm monorepo** with multiple workspaces:

```
desterlib/
├── apps/
│   ├── api/           # Backend API (Express + TypeScript)
│   └── docs/          # Documentation site (Starlight)
├── packages/
│   ├── eslint-config/ # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configuration
├── .changeset/        # Changeset files for versioning
├── .github/           # GitHub Actions workflows
└── ... (config files)
```

## Backend API Structure

Location: `apps/api/`

```
apps/api/
├── src/
│   ├── domains/       # Feature domains (business logic)
│   │   ├── movies/    # Movie management
│   │   ├── tvshows/   # TV show management
│   │   ├── library/   # Library management
│   │   ├── stream/    # Streaming functionality
│   │   ├── scan/      # Media scanning
│   │   └── settings/  # Settings management
│   ├── lib/           # Shared libraries and utilities
│   │   ├── database/  # Database client (Prisma)
│   │   ├── middleware/ # Express middleware
│   │   ├── services/  # Shared services
│   │   ├── utils/     # Utility functions
│   │   └── websocket/ # WebSocket server
│   ├── core/          # Core configuration
│   │   ├── config/    # App configuration
│   │   └── services/  # Core services
│   ├── routes/        # API route definitions
│   │   └── v1/        # API v1 routes
│   └── index.ts       # Application entry point
├── prisma/
│   └── schema.prisma  # Database schema
├── dist/              # Compiled JavaScript output
└── package.json
```

### Key Concepts

#### Domains

Domains represent distinct features or business areas:

- **movies/** - Movie catalog, metadata, CRUD operations
- **tvshows/** - TV show management, seasons, episodes
- **library/** - Overall library organization
- **stream/** - Video streaming logic
- **scan/** - File system scanning and indexing
- **settings/** - User and system settings

Each domain typically contains:

- Controllers (route handlers)
- Services (business logic)
- Models/Types (data structures)
- Utilities (domain-specific helpers)

#### Libraries

The `lib/` directory contains code shared across domains:

- **database/** - Prisma client and database utilities
- **middleware/** - Express middleware (auth, error handling, etc.)
- **services/** - Cross-cutting services (logging, caching, etc.)
- **utils/** - General-purpose utilities
- **websocket/** - WebSocket server implementation

#### Core

The `core/` directory contains:

- Application configuration
- Service initialization
- Dependency injection setup

## Documentation Site

Location: `apps/docs/`

```
apps/docs/
├── src/
│   ├── content/
│   │   └── docs/          # Documentation pages
│   │       ├── getting-started/
│   │       ├── development/
│   │       ├── api/
│   │       └── deployment/
│   ├── assets/            # Images and static assets
│   └── styles/            # Custom CSS
├── public/                # Public static files
├── astro.config.mjs       # Astro configuration
└── package.json
```

## Shared Packages

### ESLint Config

Location: `packages/eslint-config/`

Provides shared ESLint configurations:

- `base.js` - Base rules for all projects
- `next.js` - Next.js specific rules
- `react-internal.js` - React component rules

### TypeScript Config

Location: `packages/typescript-config/`

Provides shared TypeScript configurations:

- `base.json` - Base TypeScript config
- `nextjs.json` - Next.js specific config
- `react-library.json` - React library config

## Database Schema

Location: `apps/api/prisma/schema.prisma`

The database uses PostgreSQL with Prisma ORM:

```prisma
// Example models
model Movie {
  id          String   @id @default(uuid())
  title       String
  year        Int?
  path        String   @unique
  metadata    Json?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model TVShow {
  id          String   @id @default(uuid())
  title       String
  year        Int?
  seasons     Season[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Configuration Files

### Root Level

- `package.json` - Root workspace configuration
- `pnpm-workspace.yaml` - Workspace definitions
- `turbo.json` - Turbo build configuration
- `.cz-config.js` - Commitizen configuration
- `commitlint.config.js` - Commit linting rules

### Changesets

- `.changeset/config.json` - Changesets configuration
- `.changeset/*.md` - Individual changeset files

### GitHub Actions

- `.github/workflows/release.yml` - Automated releases
- `.github/workflows/version-pr.yml` - Version PR automation
- `.github/workflows/changeset-check.yml` - PR changeset validation

## Development Workflow

### Adding a New Feature

1. **Choose the right location:**
   - Domain-specific? → `apps/api/src/domains/{domain}/`
   - Shared utility? → `apps/api/src/lib/utils/`
   - API route? → `apps/api/src/routes/v1/`

2. **Follow the pattern:**
   - Controller handles HTTP requests
   - Service contains business logic
   - Utilities are pure functions

3. **Update documentation:**
   - Add/update relevant docs in `apps/docs/`

### File Naming Conventions

- **Controllers:** `{feature}.controller.ts`
- **Services:** `{feature}.service.ts`
- **Utilities:** `{feature}.util.ts`
- **Types:** `{feature}.types.ts`
- **Tests:** `{feature}.test.ts`

### Import Paths

Use TypeScript path aliases (configured in `tsconfig.json`):

```typescript
// Instead of:
import { db } from "../../../lib/database/client";

// Use:
import { db } from "@/lib/database/client";
```

## Build System

The project uses **Turbo** for orchestrating builds across the monorepo:

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter api build
pnpm --filter docs build

# Development mode
pnpm dev
```

## Testing Strategy

(To be implemented)

- Unit tests for utilities and services
- Integration tests for API endpoints
- E2E tests for critical workflows

## Next Steps

- [Versioning Guide](/development/versioning/) - Learn how to contribute
- [Quick Reference](/development/quick-reference/) - Common commands
- [Commit Guidelines](/development/commit-guidelines/) - Commit message format
