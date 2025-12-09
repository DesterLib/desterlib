---
title: TMDB Setup
description: How to get and configure your TMDB API key
---

TMDB provides metadata and artwork for your media library.

## Getting Your API Key

1. Go to [themoviedb.org](https://www.themoviedb.org/) and create an account
2. Go to **Settings** → **API** → **Request an API Key**
3. Choose **"Developer"** and fill out the form
4. Copy your **API Key (v3 auth)**

## Configuring

**In the app:**

1. Open DesterLib app → **Settings**
2. Enter your TMDB API key
3. Save

**Via API:**

```bash
curl -X POST http://localhost:3001/api/v1/settings/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "tmdb",
    "enabled": true,
    "config": {"apiKey": "your_key_here"}
  }'
```

Once configured, DesterLib will automatically fetch movie/show metadata, posters, and artwork.
