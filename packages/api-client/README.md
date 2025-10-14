# @dester/api-client

A production-ready TypeScript API client for the Dester media library with Zod validation, modular endpoints, and full type safety.

## ✨ Features

- ✅ **TypeScript**: Full type safety with auto-generated types from Zod schemas
- ✅ **Native Fetch**: Uses native `fetch` API (works in Node.js 18+ and all modern browsers)
- ✅ **Cross-Platform**: Works seamlessly in both Node.js and Browser environments
- ✅ **Modular Architecture**: Clean class-based interface (`api.movies.list()`, `api.search.search()`)
- ✅ **Real-Time Notifications**: Server-Sent Events for scan, sync, and metadata updates
- ✅ **Zod Validation**: Runtime schema validation with type inference
- ✅ **Rich Error Handling**: Custom error classes for different error types
- ✅ **Extensible**: Easy to add new endpoints
- ✅ **JSDoc Comments**: Full IntelliSense support
- ✅ **ESM + CJS**: Dual build with tsup for maximum compatibility

## 📦 Installation

```bash
npm install @dester/api-client
# or
pnpm add @dester/api-client
# or
yarn add @dester/api-client
```

## 🚀 Quick Start

```typescript
import { DesterClient } from "@dester/api-client";

// Initialize the client
const api = new DesterClient({
  baseUrl: "http://localhost:3000",
});

// Use modular endpoints with error handling
try {
  const { media: movies } = await api.movies.list({ limit: 10 });
  const { media: movie } = await api.movies.getById("movie-id");
  const searchResults = await api.search.search({ q: "inception" });

  // Get settings
  const { settings } = await api.settings.get();
} catch (error) {
  console.error("API Error:", error);
}
```

## 📖 API Reference

### Client Initialization

```typescript
const api = new DesterClient({
  baseUrl: "http://localhost:3000", // default
  headers: { "X-Custom": "value" }, // optional
  timeout: 30000, // optional, default: 30000ms
});
```

### Media Endpoints

```typescript
// Get all media with filters
const { media, total } = await api.media.list({
  type: "MOVIE",
  search: "batman",
  minRating: 7.0,
  limit: 20,
  sortBy: "rating",
  sortOrder: "desc",
});

// Get single media item
const { media: mediaItem } = await api.media.getById("media-id");

// Get statistics
const { statistics } = await api.media.getStatistics();
```

### Movies Endpoints

```typescript
// List movies
const { media: movies } = await api.movies.list({
  limit: 10,
  sortBy: "releaseDate",
  sortOrder: "desc",
});

// Get movie by ID
const { media: movie } = await api.movies.getById("movie-id");

// Get stream URL
const streamUrl = api.movies.getStreamUrl("movie-id");
// Use in <video> tag: <video src={streamUrl} controls />
```

### TV Shows Endpoints

```typescript
// List TV shows
const { media: shows } = await api.tvShows.list({ limit: 10 });

// Get TV show by ID
const { media: show } = await api.tvShows.getById("show-id");

// Get stream URL
const streamUrl = api.tvShows.getStreamUrl("show-id");
```

### Music Endpoints

```typescript
// List music
const { media: tracks } = await api.music.list({ limit: 10 });

// Get music by ID
const { media: track } = await api.music.getById("music-id");

// Get stream URL
const streamUrl = api.music.getStreamUrl("music-id");
```

### Comics Endpoints

```typescript
// List comics
const { media: comics } = await api.comics.list({ limit: 10 });

// Get comic by ID
const { media: comic } = await api.comics.getById("comic-id");

// Get stream URL
const streamUrl = api.comics.getStreamUrl("comic-id");
```

### Collections Endpoints

```typescript
// List all collections
const { collections } = await api.collections.list();

// Get collection by ID
const { collection } = await api.collections.getById("collection-id");

// Get libraries (collections that are libraries)
const { collections: libraries } = await api.collections.getLibraries();
```

### Scan Endpoints

```typescript
// Scan a directory
const { scan } = await api.scan.scan({
  path: "/path/to/movies",
  mediaType: "MOVIE",
  collectionName: "My Movies",
  updateExisting: true,
});

console.log(`Added: ${scan.stats.added}, Updated: ${scan.stats.updated}`);

// Sync a collection
const { sync } = await api.scan.sync({
  collectionName: "My Movies",
  mediaType: "MOVIE",
});

console.log(`Checked: ${sync.stats.checked}, Removed: ${sync.stats.removed}`);

// Sync all libraries
const { syncs } = await api.scan.syncAll();
```

### Search Endpoints

```typescript
// Search everything
const results = await api.search.search({ q: "inception" });
console.log(results.media, results.collections);

// Search media only
const mediaResults = await api.search.search({ q: "batman", type: "media" });

// Search collections only
const collectionResults = await api.search.search({
  q: "marvel",
  type: "collections",
});
```

### Settings Endpoints

```typescript
// Get settings
const { message, settings } = await api.settings.get();

// Update settings
const { settings: updated } = await api.settings.update({
  tmdbApiKey: "your-api-key",
});

// Check setup status
const { isSetupComplete } = await api.settings.getSetupStatus();
```

### Notifications (Real-Time Updates)

Server-Sent Events (SSE) for real-time notifications about scan, sync, and metadata operations.

```typescript
// Connect to notification stream
const eventSource = api.notifications.stream((event) => {
  console.log(`[${event.type}] ${event.message}`);

  if (event.type === "scan" && event.status === "completed") {
    console.log("Scan finished!");
    // Refresh your UI, show toast, etc.
  }
});

// Clean up when done
eventSource.close();
```

**React Hook Example:**

```typescript
import { useEffect, useState } from "react";
import type { NotificationEvent } from "@dester/api-client";

export function useNotifications() {
  const [notification, setNotification] = useState<NotificationEvent | null>(
    null
  );

  useEffect(() => {
    const eventSource = api.notifications.stream(
      (event) => setNotification(event),
      (error) => console.error("SSE error:", error)
    );
    return () => eventSource.close();
  }, []);

  return notification;
}
```

**Flutter/Dart Example:**

```dart
// Use the eventsource package: https://pub.dev/packages/eventsource
import 'package:eventsource/eventsource.dart';
import 'dart:convert';

final url = 'http://localhost:3000/api/notifications/stream';
final eventSource = await EventSource.connect(url);

eventSource.listen((event) {
  final notification = jsonDecode(event.data!);
  print('Notification: ${notification['message']}');
});

await eventSource.close(); // Clean up
```

**Notification Event Structure:**

```typescript
{
  id: string;              // Unique notification ID
  type: string;            // 'scan' | 'metadata' | 'sync' | 'collection' | 'settings' | 'error'
  status: string;          // 'started' | 'progress' | 'completed' | 'failed'
  message: string;         // Human-readable message
  timestamp: string;       // ISO 8601 timestamp
  data?: object;           // Optional additional data
}
```

### Utility Methods

```typescript
// Update base URL dynamically
api.setBaseUrl("https://api.example.com");

// Get the underlying HTTP client for custom requests
const httpClient = api.getHttpClient();
const custom = await httpClient.get("/custom-endpoint");
```

## 🛡️ Error Handling

The client provides specific error classes for different scenarios:

```typescript
import {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  NetworkError,
  RateLimitError,
  ServerError,
} from "@dester/api-client";

try {
  const movie = await api.movies.getById("invalid-id");
} catch (error) {
  if (error instanceof ValidationError) {
    // Validation failed (422 or schema validation)
    console.error(error.getValidationMessages());
  } else if (error instanceof NotFoundError) {
    // 404 - Resource not found
    console.error("Movie not found");
  } else if (error instanceof NetworkError) {
    // Network/timeout errors
    console.error("Connection failed");
  } else if (error instanceof ServerError) {
    // 5xx errors
    console.error("Server error");
  } else if (error instanceof ApiError) {
    // Generic API error
    console.error(error.statusCode, error.message);
  }
}
```

## 🎯 TypeScript Types

All types are automatically inferred from Zod schemas:

```typescript
import type {
  // Core types
  Media,
  MediaType,
  Movie,
  TVShow,
  Season,
  Episode,
  Music,
  Comic,
  Person,
  Genre,
  Collection,
  Settings,
  // Request/Response types
  MediaFilters,
  ScanRequest,
  ScanResponse,
  SearchFilters,
  SearchResponse,
  // Notification types
  NotificationEvent,
  NotificationType,
  NotificationStatus,
  // Error types
  ApiError,
  ValidationError,
  NotFoundError,
} from "@dester/api-client";

// Media types
type MediaType = "MOVIE" | "TV_SHOW" | "MUSIC" | "COMIC";

// Type-safe filters
const filters: MediaFilters = {
  type: "MOVIE",
  search: "batman",
  minRating: 7.0,
  limit: 20,
  sortBy: "rating",
  sortOrder: "desc",
};
```

## 📚 Documentation

- [Complete Usage Examples](./USAGE_EXAMPLES.md)
- [Folder Structure](./FOLDER_STRUCTURE.md)

## 🏗️ Complete Example

```typescript
import { DesterClient } from "@dester/api-client";

// Initialize client
const api = new DesterClient({
  baseUrl: "http://localhost:3000",
});

// Check setup status
const { isSetupComplete } = await api.settings.getSetupStatus();

if (!isSetupComplete) {
  await api.settings.update({
    tmdbApiKey: "your-tmdb-api-key",
  });
}

// Scan a movie directory
const scanResult = await api.scan.scan({
  path: "/Movies",
  mediaType: "MOVIE",
  collectionName: "My Movies",
  updateExisting: true,
});

console.log(`Scanned ${scanResult.scan.totalFiles} files`);
console.log(`Added: ${scanResult.scan.stats.added}`);

// Get all movies sorted by rating
const { media: movies } = await api.movies.list({
  sortBy: "rating",
  sortOrder: "desc",
  limit: 20,
});

// Display movies
movies.forEach((movie) => {
  console.log(`${movie.title} - ${movie.rating}/10`);
  const streamUrl = api.movies.getStreamUrl(movie.id);
  console.log(`Stream: ${streamUrl}`);
});

// Search for content
const searchResults = await api.search.search({ q: "batman" });
console.log(`Found ${searchResults.total} results`);
```

## 🌐 Framework Examples

### React

```tsx
import { DesterClient } from "@dester/api-client";
import { useEffect, useState } from "react";

const api = new DesterClient({ baseUrl: "http://localhost:3000" });

function MovieList() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMovies() {
      try {
        const { media } = await api.movies.list({ limit: 20 });
        setMovies(media);
      } catch (error) {
        console.error("Failed to fetch movies:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {movies.map((movie) => (
        <div key={movie.id}>
          <h3>{movie.title}</h3>
          <video src={api.movies.getStreamUrl(movie.id)} controls />
        </div>
      ))}
    </div>
  );
}
```

### Vue

```vue
<script setup lang="ts">
import { DesterClient } from "@dester/api-client";
import { ref, onMounted } from "vue";

const api = new DesterClient({ baseUrl: "http://localhost:3000" });
const movies = ref([]);

onMounted(async () => {
  const { media } = await api.movies.list({ limit: 20 });
  movies.value = media;
});
</script>

<template>
  <div v-for="movie in movies" :key="movie.id">
    <h3>{{ movie.title }}</h3>
    <video :src="api.movies.getStreamUrl(movie.id)" controls />
  </div>
</template>
```

### Next.js (App Router)

```typescript
// app/movies/page.tsx
import { DesterClient } from '@dester/api-client';

const api = new DesterClient({ baseUrl: 'http://localhost:3000' });

export default async function MoviesPage() {
  const { media: movies } = await api.movies.list({ limit: 20 });

  return (
    <div>
      {movies.map(movie => (
        <div key={movie.id}>
          <h3>{movie.title}</h3>
          <p>{movie.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🧪 Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Watch mode
pnpm dev

# Type check
pnpm typecheck
```

## 📦 Build Output

The package is built with `tsup` and provides:

- **ESM**: `dist/index.js`
- **CJS**: `dist/index.cjs`
- **Types**: `dist/index.d.ts` & `dist/index.d.cts`
- **Source Maps**: Included for debugging

## 📄 License

MIT
