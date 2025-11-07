# API File Structure

This document outlines the reorganized file structure of the DesterLib API following clean architecture principles.

## 📁 Directory Structure

```
apps/api/src/
├── core/                          # Core application configuration and services
│   ├── config/                    # Application configuration
│   │   ├── env.ts                 # Environment configuration
│   │   ├── routes.ts              # Route setup and static file serving
│   │   ├── settings.ts            # User settings management
│   │   └── index.ts               # Config exports
│   └── services/                  # Shared business services
│       ├── genreService.ts        # Genre management service
│       └── index.ts               # Services exports
├── domains/                       # Domain-driven modules
│   ├── library/                   # Library management domain
│   │   ├── library.controller.ts
│   │   ├── library.routes.ts
│   │   ├── library.schema.ts
│   │   ├── library.services.ts
│   │   ├── library.types.ts
│   │   └── index.ts
│   ├── movies/                    # Movies domain
│   │   ├── movies.controller.ts
│   │   ├── movies.routes.ts
│   │   ├── movies.schema.ts
│   │   ├── movies.services.ts
│   │   ├── movies.types.ts
│   │   └── index.ts
│   ├── scan/                      # Media scanning domain
│   │   ├── scan.controller.ts
│   │   ├── scan.routes.ts
│   │   ├── scan.schema.ts
│   │   ├── scan.services.ts
│   │   ├── scan.types.ts
│   │   └── index.ts
│   ├── settings/                  # Application settings domain
│   │   ├── settings.controller.ts
│   │   ├── settings.routes.ts
│   │   ├── settings.types.ts
│   │   └── index.ts
│   ├── stream/                    # Media streaming domain
│   │   ├── stream.controller.ts
│   │   ├── stream.routes.ts
│   │   ├── stream.schema.ts
│   │   └── stream.services.ts
│   │   └── index.ts
│   ├── tvshows/                   # TV Shows domain
│   │   ├── tvshows.controller.ts
│   │   ├── tvshows.routes.ts
│   │   ├── tvshows.schema.ts
│   │   ├── tvshows.services.ts
│   │   ├── tvshows.types.ts
│   │   └── index.ts
│   └── index.ts                   # Domain exports
├── lib/                           # Shared libraries and utilities
│   ├── build/                     # Build-specific utilities
│   │   ├── static-routes.ts       # Static file serving
│   │   └── index.ts
│   ├── config/                    # Configuration utilities
│   │   ├── swagger.ts             # API documentation setup
│   │   └── index.ts
│   ├── database/                  # Database layer
│   │   ├── postgres-manager.ts    # PostgreSQL management
│   │   ├── prisma.ts              # Prisma client
│   │   └── index.ts
│   ├── middleware/                # Express middleware
│   │   ├── errorHandler.ts
│   │   ├── middleware.ts
│   │   ├── sanitization.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   ├── providers/                 # External service providers
│   │   └── tmdb/
│   │       ├── tmdb.services.ts
│   │       └── tmdb.types.ts
│   ├── utils/                     # Utility functions
│   │   ├── extractExternalId.ts
│   │   ├── genreMapping.ts
│   │   ├── logger.ts
│   │   ├── sanitization.ts
│   │   ├── serialization.ts
│   │   └── index.ts
│   ├── websocket/                 # WebSocket management
│   │   └── index.ts
│   └── index.ts                   # Library exports
├── routes/                        # Route definitions
│   ├── index.ts                   # Main route handler
│   └── v1/
│       └── index.ts               # API v1 routes
├── scripts/                       # Build and utility scripts
├── types/                         # TypeScript type definitions
│   └── express.d.ts
└── index.ts                       # Application entry point
```

## 🏗️ Architecture Principles

### 1. **Core Layer** (`core/`)

Contains fundamental application configuration and shared services that are used across multiple domains.

- **Config**: Environment variables, route setup, user settings
- **Services**: Shared business logic (e.g., genre management)

### 2. **Domain Layer** (`domains/`)

Each domain represents a specific business capability:

- **Self-contained**: Each domain has its own controllers, routes, schemas, services, and types
- **Clear boundaries**: Domains communicate through well-defined interfaces
- **Consistent structure**: All domains follow the same file organization pattern

### 3. **Library Layer** (`lib/`)

Shared infrastructure and utilities:

- **Database**: Database connection and management
- **Middleware**: Express middleware for cross-cutting concerns
- **Providers**: External service integrations (TMDB, etc.)
- **Utils**: Pure utility functions

### 4. **Routes Layer** (`routes/`)

Route definitions and API endpoint organization:

- **Versioned**: Clear API versioning strategy
- **Domain routing**: Routes delegate to appropriate domain handlers

## 🔄 Import Patterns

### Domain-to-Domain Communication

```typescript
// Import shared services through core
import { settingsManager } from "../../core/config/settings";

// Import utilities through lib
import { logger } from "../../lib/utils";
```

### Cross-Domain Dependencies

```typescript
// Import types from other domains when needed
import type { ScanResult } from "../../domains/scan";
```

### Library Usage

```typescript
// Import from lib for infrastructure concerns
import { validate } from "../../lib/middleware/validation";
import prisma from "../../lib/database/prisma";
```

## 📋 Benefits

1. **Maintainability**: Clear separation of concerns makes the codebase easier to understand and modify
2. **Testability**: Each domain can be tested in isolation
3. **Scalability**: New domains can be added without affecting existing ones
4. **Reusability**: Shared services in `core/` can be used across domains
5. **Type Safety**: Proper TypeScript organization with clear import paths

## 🏗️ Build System Separation

Build-related code has been isolated from the core application:

- **Build Scripts**: Moved to `../../build/scripts/` (project root level)
- **Build Configs**: Moved to `../../build/configs/` (project root level)
- **Static Routes**: Moved to `lib/build/` for runtime build-specific logic
- **PKG Config**: Extracted from package.json to separate JSON file

This separation ensures:

- **Clean Dependencies**: Core application doesn't depend on build tools
- **Maintainability**: Build configuration is centralized and versioned
- **Testability**: Build logic can be tested independently
- **Reusability**: Build configurations can be shared across environments

## 🚀 Migration Notes

The structure was reorganized from the previous flat structure to this domain-driven approach. Key changes:

- Moved configuration files from `lib/config/` to `core/config/`
- Organized route handlers by domain instead of by HTTP method
- Created proper domain boundaries with consistent file patterns
- Established clear import patterns for cross-domain communication
- **Separated build-related code** into dedicated build system directory
