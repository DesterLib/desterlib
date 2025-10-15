# @dester/api-client

Auto-generated TypeScript API client for Dester Media Library.

## 🚀 Usage

### Installation

The client is automatically available in the monorepo workspace:

```typescript
import { configure /* your API methods */ } from "@dester/api-client";
```

### Configuration

Configure the base URL before making requests:

```typescript
import { configure } from "@dester/api-client";

configure({
  baseURL: "http://localhost:3000",
  headers: {
    // Add any custom headers here
  },
});
```

### Example Usage

```typescript
import { configure, getApiMedia, postApiScan } from "@dester/api-client";

// Configure API
configure({ baseURL: "http://localhost:3000" });

// Get all media
const media = await getApiMedia({
  type: "MOVIE",
  limit: 10,
});

// Scan a directory
const result = await postApiScan({
  path: "/path/to/movies",
  mediaType: "MOVIE",
  collectionName: "My Movies",
});
```

## 🔄 Generating the Client

The API client is auto-generated from the OpenAPI spec using [Orval](https://orval.dev/).

### Prerequisites

Make sure the API server is running:

```bash
pnpm --filter api dev
```

### Generate

In another terminal:

```bash
pnpm generate:api
```

This will:

1. Fetch the OpenAPI spec from `http://localhost:3000/api-docs.json`
2. Generate TypeScript types and API functions
3. Output to `packages/api-client/src/generated/`

### When to Regenerate

Regenerate the client whenever you:

- Add new API endpoints
- Change request/response types
- Update OpenAPI documentation

## 📁 Structure

```
packages/api-client/
├── src/
│   ├── core/
│   │   └── fetcher.ts      # Custom fetch wrapper
│   ├── generated/
│   │   └── api.ts          # Auto-generated API (don't edit!)
│   └── index.ts            # Main export
├── package.json
└── README.md
```

## 🔧 Configuration

See `orval.config.ts` in the root directory for generation settings.

## ⚠️ Important

- **Never edit `src/generated/` directly** - changes will be overwritten
- Always regenerate after API changes
- Commit generated files to git for consistency
