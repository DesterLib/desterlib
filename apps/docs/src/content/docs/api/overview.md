---
title: API Server
description: DesterLib API Server - Backend for your personal media library
---

The DesterLib API Server is the backend that powers your personal media library. It provides a comprehensive REST API for managing your media library, streaming content, and integrating with client applications.

## What is the API Server?

The API Server handles:
- **Media Library Management** - Scan, organize, and index your media files
- **Metadata Fetching** - Automatic metadata and artwork from TMDB
- **Video Streaming** - Adaptive streaming endpoints
- **Watch Progress** - Track viewing history and resume points
- **WebSocket Events** - Real-time updates for scans and library changes

**Repository**: [desterlib](https://github.com/DesterLib/desterlib) (monorepo)

## Interactive API Documentation

The API is fully documented using **Swagger/OpenAPI**. When the API server is running, you can access interactive documentation at:

🔗 **[http://localhost:3001/api/docs](http://localhost:3001/api/docs)**

The interactive documentation allows you to:
- 📖 Browse all available endpoints
- 🧪 Test API requests directly from your browser
- 📋 View request/response schemas
- 🔍 See example payloads
- 🔐 Authenticate and test with your own data

## Starting the API Server

### Development Mode

```bash
cd apps/api
pnpm dev
```

The API will be available at `http://localhost:3001`

### Production Mode

```bash
# Using Docker
docker-compose up -d

# Or build and start manually
cd apps/api
pnpm build
pnpm start
```

## API Base URL

**Development:** `http://localhost:3001`  
**Production:** Configure via `FRONTEND_URL` environment variable

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. See the Swagger docs for authentication endpoints and token management.

## Rate Limiting

API requests are rate-limited to prevent abuse. Default limits:
- **Window:** 15 minutes
- **Max requests:** 100 requests per window

Configure via environment variables:
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`

## API Domains

The API is organized into the following domains:

### 🎬 Movies
Manage your movie collection:
- List movies with filtering and sorting
- Get movie details
- Update metadata
- Delete movies
- Search movies

### 📺 TV Shows
Manage TV shows, seasons, and episodes:
- List TV shows
- Get show, season, and episode details
- Track episode progress
- Manage metadata

### 📚 Library
Overall library management:
- Get library statistics
- Manage media libraries
- Configure library settings

### 🔍 Scan
Media scanning and indexing:
- Trigger media scans
- Check scan status
- View scan history
- Configure scan settings

### 🎞️ Stream
Video streaming endpoints:
- Stream video content
- Get video information
- Manage streaming sessions

### ⚙️ Settings
Application settings:
- Get and update settings
- Configure TMDB integration
- Manage system preferences

## WebSocket API

DesterLib also provides WebSocket support for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};
```

See the Swagger documentation for WebSocket event types and payloads.

## CORS Configuration

The API supports CORS for cross-origin requests. Configure allowed origins via the `FRONTEND_URL` environment variable.

## API Versioning

Current API version: **v1**

All endpoints are prefixed with `/api/v1/`

Example: `http://localhost:3001/api/v1/movies`

## Example Requests

### Get All Movies

```bash
curl http://localhost:3001/api/v1/movies
```

### Get Movie by ID

```bash
curl http://localhost:3001/api/v1/movies/{movieId}
```

### Get TV Shows

```bash
curl http://localhost:3001/api/v1/tvshows
```

For complete endpoint documentation with all parameters, request/response schemas, and interactive testing, visit the **[Swagger Documentation](http://localhost:3001/api/docs)** when your API server is running.

## Client Libraries

Currently, the DesterLib Flutter app uses the API directly. If you're building your own client:

1. Use the Swagger/OpenAPI spec to generate client libraries
2. Export the spec: Visit `http://localhost:3001/api/docs.json`
3. Use tools like [OpenAPI Generator](https://openapi-generator.tech/) to create clients in your language

## Need Help?

- 🐛 [Report API Issues](https://github.com/DesterLib/desterlib/issues)
- 💬 [Ask Questions](https://github.com/DesterLib/desterlib/discussions)
- 📖 [View API Source](https://github.com/DesterLib/desterlib/tree/main/apps/api/src)

