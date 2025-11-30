---
title: TMDB Setup
description: How to get and configure your TMDB API key
---

TMDB (The Movie Database) provides metadata and artwork for your media library. A TMDB API key is required for DesterLib to fetch movie and TV show information.

## Getting Your TMDB API Key

### 1. Create a TMDB Account

1. Go to [themoviedb.org](https://www.themoviedb.org/)
2. Click **"Join TMDB"** in the top right
3. Fill out the registration form
4. Verify your email address

### 2. Request an API Key

1. Log in to your TMDB account
2. Go to **Settings** → **API**
3. Click **"Request an API Key"**
4. Choose **"Developer"** (not commercial)
5. Accept the terms of use
6. Fill out the application form:
   - **Application URL**: Can use `http://localhost` or your personal site
   - **Application Summary**: "Personal media server for organizing my collection"
7. Submit the request

Your API key will be generated instantly!

### 3. Copy Your API Key

You'll see two keys:

- **API Key (v3 auth)** - This is what you need ✅
- **API Read Access Token** - Not needed

Copy the **API Key (v3 auth)** - it looks like: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

## Configuring in DesterLib

### During CLI Setup

The CLI doesn't ask for TMDB during initial setup. You'll configure it in the app after installation.

### In the Mobile/Desktop App

1. Open the DesterLib app
2. Go to **Settings**
3. Navigate to **TMDB Integration** or **Settings**
4. Enter your API key
5. Save

The app will now fetch metadata for your media!

### Via API (Advanced)

You can configure it via the Settings API. The API key will automatically sync to the metadata provider system:

```bash
curl -X PUT http://localhost:3001/api/v1/settings \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbApiKey": "your_api_key_here"
  }'
```

Alternatively, you can directly manage the TMDB provider:

```bash
# Create or update TMDB provider
curl -X POST http://localhost:3001/api/v1/settings/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "tmdb",
    "enabled": true,
    "priority": 0,
    "config": {
      "apiKey": "your_api_key_here",
      "baseUrl": "https://api.themoviedb.org/3",
      "rateLimitRps": 4.0
    }
  }'
```

See the [Settings API documentation](/api/overview/#settings-endpoints) for more details.

## What TMDB Is Used For

Once configured, DesterLib uses TMDB to fetch:

- 🎬 **Movie/Show Titles** - Proper names and translations
- 📝 **Descriptions** - Plot summaries and overviews
- 🎨 **Poster Images** - Cover art for your media
- 🖼️ **Backdrop Images** - Background images
- ⭐ **Ratings** - TMDB community ratings
- 📅 **Release Dates** - When movies/shows were released
- 🎭 **Genres** - Categories and classifications
- 👥 **Cast & Crew** - Actor and director information (coming soon)

## Scanning Without TMDB

If you haven't configured TMDB yet:

- ✅ DesterLib will still scan your files
- ✅ Files will be added to the database
- ❌ Metadata won't be fetched
- ❌ No posters or artwork

You can configure TMDB later and rescan to fetch metadata.

## TMDB API Limits

TMDB's free API has rate limits:

- **40 requests per 10 seconds**
- DesterLib automatically handles rate limiting
- Large libraries may take longer to scan due to this

## Provider System

DesterLib uses a **provider-based architecture** for metadata fetching:

- **TMDB** is one of potentially multiple metadata providers
- Providers are managed in the database (not environment variables)
- You can configure multiple providers with priority ordering
- The system automatically uses the highest priority enabled provider

### Managing Providers

View and manage providers via the API:

```bash
# List all providers
curl http://localhost:3001/api/v1/settings/providers

# Get specific provider
curl http://localhost:3001/api/v1/settings/providers/tmdb

# Update provider configuration
curl -X PUT http://localhost:3001/api/v1/settings/providers/tmdb \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "priority": 0,
    "config": {
      "apiKey": "your_key",
      "baseUrl": "https://api.themoviedb.org/3",
      "rateLimitRps": 4.0
    }
  }'
```

## Privacy

- TMDB API key is stored securely in your database
- Only your server communicates with TMDB
- No data is sent to DesterLib developers
- Your API key never leaves your server
- Provider configurations are stored in the `metadata_providers` table

## Troubleshooting

### Invalid API Key Error

If you see "Invalid TMDB API key":

1. Verify you copied the **v3 API Key** (not the Read Access Token)
2. Check for extra spaces or characters
3. Make sure the key is active in your TMDB account

### Rate Limit Errors

If scans are slow or failing:

- This is normal for large libraries
- TMDB limits: 40 requests/10 seconds
- DesterLib automatically retries failed requests
- Just wait - scans will complete eventually

### No Metadata Fetched

If scans complete but metadata is missing:

1. Verify TMDB key is configured
2. Check API logs for errors: `docker-compose logs -f api`
3. Try manually fetching for one item
4. Ensure file names are recognizable (e.g., `The Matrix (1999).mkv`)

## Related Documentation

- [Installation Guide](/getting-started/installation/) - Set up DesterLib
- [Library Scanning](/guides/scanning/) - How scanning works
- [Settings API](/api/overview/#api-endpoints) - Configure via API
