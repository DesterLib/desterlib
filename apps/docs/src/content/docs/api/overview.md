---
title: API Server
description: DesterLib API Server - Backend for your personal media library
---

The DesterLib API Server is the backend that powers your personal media library. It provides a comprehensive REST API for managing your media library, streaming content, and integrating with client applications.

## What is the API Server?

The API Server handles:

- **Media Library Management** - Scan, organize, and index your media files
- **Metadata Fetching** - Automatic metadata and artwork from TMDB
- **Video Streaming** - Direct video streaming endpoints
- **Search** - Search across movies and TV shows
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

All endpoints: `http://localhost:3001`

## Authentication

**Current Status:** Authentication is not yet implemented. The API is currently open for local network access.

:::note[Planned Feature]
JWT authentication is planned and can be enabled via the `enableRouteGuards` setting. Currently disabled by default.
:::

## Rate Limiting

API requests are rate-limited to prevent abuse. Default limits:

- **Window:** 15 minutes
- **Max requests:** 100 requests per window

Configure via environment variables:

- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`

## API Endpoints

The API is organized into the following domains:

### 🔍 `/api/v1/search`

Search across your media library:

- Search movies and TV shows by title
- Case-insensitive search
- Returns enriched metadata with mesh gradient colors

### 🔢 `/api/v1/scan`

Media scanning and indexing:

- Trigger media scans (movies or TV shows)
- Resume interrupted scans
- Check scan job status
- Cleanup stale jobs
- Real-time progress via WebSocket

### 📚 `/api/v1/library`

Library management:

- Get library statistics
- List all libraries
- Create and delete libraries
- Get library details

### 🎬 `/api/v1/movies`

Movie management:

- List all movies (10 most recent)
- Get movie details by ID
- Includes poster, backdrop, metadata
- Returns stream URL

### 📺 `/api/v1/tvshows`

TV show management:

- List all TV shows (10 most recent)
- Get show details by ID
- Season and episode information
- Enriched metadata

### 🎞️ `/api/v1/stream`

Video streaming:

- Stream media files directly
- Supports range requests for seeking
- Optimized for playback

### ⚙️ `/api/v1/settings`

Application settings:

- Get and update settings
- Configure TMDB API key (auto-syncs to metadata providers)
- Manage metadata providers
- Manage system preferences
- Enable/disable features

**Provider Management:**

- `GET /api/v1/settings/providers` - List all metadata providers
- `POST /api/v1/settings/providers` - Create/update provider
- `GET /api/v1/settings/providers/:name` - Get provider details
- `PUT /api/v1/settings/providers/:name` - Update provider
- `DELETE /api/v1/settings/providers/:name` - Delete provider

### 📋 `/api/v1/logs`

Server logs access:

- View application logs
- Monitor system activity

## WebSocket API

Real-time updates for scan progress and library changes:

**Connection:** `ws://localhost:3001/ws`

**Events:**

- `scan:progress` - Scan progress updates with phases and percentages
- `scan:complete` - Scan job completed
- `scan:error` - Scan job failed

**Example:**

```javascript
const ws = new WebSocket("ws://localhost:3001/ws");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "scan:progress") {
    console.log(`${data.phase}: ${data.progress}%`);
  }
};
```

## Special Features

### Mesh Gradient Colors

All media items include `meshGradientColors` - an array of 4 hex colors extracted from poster images for beautiful UI backgrounds:

```json
{
  "media": {
    "title": "The Matrix",
    "meshGradientColors": ["#7C3AED", "#2563EB", "#EC4899", "#8B5CF6"]
  }
}
```

These colors are generated on-demand when fetching media and cached for performance.

## CORS Configuration

The API automatically allows:

- **Localhost** - All localhost origins in development
- **Local Network** - LAN IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
- **Mobile Apps** - Requests with no origin header

No configuration needed for local network access!

## API Versioning

Current API version: **v1**

All endpoints are prefixed with `/api/v1/`

Example: `http://localhost:3001/api/v1/movies`

## Example Requests

### Search Media

```bash
curl "http://localhost:3001/api/v1/search?query=matrix"
```

### List Movies

```bash
curl http://localhost:3001/api/v1/movies
```

### Get Movie Details

```bash
curl http://localhost:3001/api/v1/movies/{movieId}
```

### Trigger Scan

```bash
curl -X POST http://localhost:3001/api/v1/scan/path \
  -H "Content-Type: application/json" \
  -d '{"path": "/media/movies", "mediaType": "movie"}'
```

### Get Libraries

```bash
curl http://localhost:3001/api/v1/library
```

## Complete API Reference

For full endpoint documentation with all parameters, request/response schemas, and interactive testing:

**[Swagger Documentation →](http://localhost:3001/api/docs)**

The Swagger UI includes:

- Complete API schema
- Request/response examples
- Try it out functionality
- Authentication details (when implemented)

## Client Libraries

Currently, the DesterLib Flutter app uses the API directly. If you're building your own client:

1. Use the Swagger/OpenAPI spec to generate client libraries
2. Export the spec: Visit `http://localhost:3001/api/docs.json`
3. Use tools like [OpenAPI Generator](https://openapi-generator.tech/) to create clients in your language

## Need Help?

- 🐛 [Report API Issues](https://github.com/DesterLib/desterlib/issues)
- 💬 [Ask Questions](https://github.com/DesterLib/desterlib/discussions)
- 📖 [View API Source](https://github.com/DesterLib/desterlib/tree/main/apps/api/src)
