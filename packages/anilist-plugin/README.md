# AniList Plugin

AniList metadata provider plugin for DesterLib. Fetches anime metadata from the AniList GraphQL API.

## Features

- ✅ Anime search by title and year
- ✅ Full anime details with images
- ✅ Rate limiting (1 request/second by default)
- ✅ Retry logic with exponential backoff
- ✅ Maps AniList data to standard metadata format

## Installation

The plugin is part of the DesterLib monorepo. Install dependencies:

```bash
pnpm install
```

## Configuration

AniList doesn't require an API key for basic queries. The plugin can be configured with:

- `rateLimitRps` (optional): Requests per second (default: 1)
- `logger` (optional): Logger instance

## Usage

### In API Configuration

Add the plugin to your `config.plugins` array:

```typescript
plugins: ["@dester/anilist-plugin"];
```

### Plugin Initialization

The plugin will be automatically loaded and initialized by the PluginManager in `server.ts`.

## API

### `fetchMetadata(title: string, year?: number, mediaType?: string)`

Fetches anime metadata from AniList.

**Parameters:**

- `title`: Anime title to search for
- `year`: Optional year to filter results
- `mediaType`: Media type (currently supports "MOVIE", maps to anime)

**Returns:**

- `PluginMetadataResult | null`: Standardized metadata format

**Example:**

```typescript
const plugin = new AniListPlugin();
await plugin.init({ logger });
await plugin.start();

const metadata = await plugin.fetchMetadata("Attack on Titan", 2013);
```

## AniList API

- **Endpoint**: `https://graphql.anilist.co`
- **Rate Limit**: ~90 requests per minute (1.5 req/s)
- **Authentication**: Not required for basic queries
- **GraphQL**: Uses GraphQL API

## Data Mapping

AniList data is mapped to the standard metadata format:

- **Title**: English title (fallback to romaji, then native)
- **Overview**: Description with HTML tags removed
- **Release Date**: Start date in ISO format
- **Rating**: Average score converted from 0-100 to 0-10 scale
- **Poster**: Cover image (extraLarge or large)
- **Backdrop**: Banner image
- **Genres**: Array of genre names

## Limitations

- Currently only supports anime (not manga)
- No logo support (AniList doesn't provide logos)
- No null poster/backdrop variants (uses same image for both)

## Development

Build the plugin:

```bash
pnpm build
```

Watch mode:

```bash
pnpm dev
```

## External ID Source

The plugin maps to `ExternalIdSource.MYANIMELIST` in the database (since both are anime databases). If you want a separate `ANILIST` enum value, you'll need to:

1. Add `ANILIST` to the `ExternalIdSource` enum in `schema.prisma`
2. Create a migration
3. Update the mapping in `metadata-fetcher.service.ts`
