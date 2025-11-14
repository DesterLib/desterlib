---
title: Version Management
description: How DesterLib manages versions across the API and clients
---

DesterLib uses **centralized version management** with strict version matching between the API and all client applications.

## Overview

All versions are managed from a single source of truth: the root `package.json`. A sync script automatically propagates version changes to all dependent projects.

**Current Version:** `0.1.0`

## Version Format

We follow [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible functionality additions  
- **PATCH**: Backward-compatible bug fixes

## Version Matching Rules

The system enforces **strict semantic versioning**:

- ✅ **Major.Minor** must match exactly
- ✅ **Patch** can differ (backwards compatible)

### Compatibility Examples

| Client | API | Compatible? | Reason |
|--------|-----|-------------|--------|
| 0.1.0 | 0.1.0 | ✅ Yes | Exact match |
| 0.1.0 | 0.1.5 | ✅ Yes | Patch difference OK |
| 0.1.0 | 0.2.0 | ❌ No | Minor version mismatch |
| 0.1.0 | 1.0.0 | ❌ No | Major version mismatch |

## Updating Versions

### Quick Process

```bash
# 1. Update version in root package.json
# Edit: "version": "0.2.0"

# 2. Sync all versions across projects
pnpm version:sync

# 3. Update CHANGELOG.md with changes

# 4. Commit and tag
pnpm commit
git tag v0.2.0
git push origin dev --tags
```

### What Gets Synced

The `pnpm version:sync` script automatically updates:

- ✅ `apps/api/package.json` - API version
- ✅ `../desterlib-flutter/pubspec.yaml` - Flutter app version
- ✅ `../desterlib-flutter/lib/api/pubspec.yaml` - Generated client version
- ✅ `../desterlib-flutter/lib/core/config/api_config.dart` - Client version constant

### Manual Updates

You must manually update:

- 📝 `CHANGELOG.md` - Document your changes
- 📝 Commit message (use conventional commits)

## How It Works

### API Side

1. **Version Exposure**
   - `/health` endpoint returns: `{ status, version, timestamp, uptime }`
   - All responses include `X-API-Version` header
   - Swagger docs display current version

2. **Version Validation**
   - Middleware checks `X-Client-Version` header on all `/api/v1` requests
   - Returns HTTP 426 (Upgrade Required) if incompatible
   - Provides clear error message with upgrade instructions

3. **Compatibility Check**
   ```typescript
   // Major and minor must match exactly
   client.major === api.major && client.minor === api.minor
   ```

### Client Side

1. **Version Declaration**
   - All requests include `X-Client-Version: 0.1.0` header
   - Version constant synced from root package.json

2. **Version Detection**
   - Dio interceptor reads `X-API-Version` from responses
   - Automatically updates version provider
   - Handles HTTP 426 errors gracefully

3. **User Experience**
   - Shows friendly error when version mismatch occurs
   - Suggests updating the app
   - Provides clear instructions

## Error Handling

### API Response (HTTP 426)

When versions are incompatible:

```json
{
  "success": false,
  "error": "Version mismatch",
  "message": "Client version 0.1.0 is not compatible with API version 0.2.0. Please update your client.",
  "data": {
    "clientVersion": "0.1.0",
    "apiVersion": "0.2.0",
    "upgradeRequired": true
  }
}
```

### Client Behavior

The Flutter client:
1. Detects version mismatch (HTTP 426)
2. Updates version provider
3. Shows user-friendly error
4. Suggests app update

## Version Sync Script

### Usage

Check version consistency:
```bash
pnpm version:check
```

Sync all versions:
```bash
pnpm version:sync
```

### Output Example

```bash
📦 Syncing version: 0.1.0
──────────────────────────────────────────────────
✅ Updated apps/api/package.json: 0.1.0
✅ Updated desterlib-flutter/pubspec.yaml: 0.1.0
✅ Updated desterlib-flutter/lib/api/pubspec.yaml: 0.1.0
✅ Updated desterlib-flutter/lib/core/config/api_config.dart: 0.1.0

──────────────────────────────────────────────────
✅ Successfully updated 4 file(s)
```

## API Route Version vs Semantic Version

Don't confuse these two concepts:

- **API Route Version:** `v1` in `/api/v1/...` - Rarely changes, represents API schema version
- **Semantic Version:** `0.1.0` - Changes with each release, represents application version

In `api_config.dart`:
```dart
static const String apiRouteVersion = 'v1';     // API endpoint version
static const String clientVersion = '0.1.0';    // Semantic version
```

## Development

### Skipping Version Checks

For local development, you can temporarily disable validation:

1. Comment out `validateVersion` middleware in `setup.middleware.ts`
2. Or omit the `X-Client-Version` header (logs warning but allows request)

### Testing Version Mismatches

To test the version mismatch flow:

1. Change `clientVersion` in `api_config.dart` to a different version
2. Make an API request
3. Verify HTTP 426 response
4. Verify client handles error appropriately

## Best Practices

1. **Keep versions in sync** - Use `pnpm version:sync` after updating root version
2. **Document changes** - Always update CHANGELOG.md
3. **Use conventional commits** - Makes changelog generation easier
4. **Test thoroughly** - Test both compatible and incompatible scenarios
5. **Clear communication** - Inform users about breaking changes

## Troubleshooting

### Versions Out of Sync

```bash
# Fix it
pnpm version:sync
```

### Script Not Found

```bash
# Make executable
chmod +x scripts/sync-version.js

# Or run directly
node scripts/sync-version.js
```

### Manual Verification

Check these files if sync seems incorrect:

1. `package.json` - Root version (source of truth)
2. `apps/api/package.json` - Should match root
3. `desterlib-flutter/pubspec.yaml` - Should match root
4. `desterlib-flutter/lib/api/pubspec.yaml` - Should match root
5. `desterlib-flutter/lib/core/config/api_config.dart` - `clientVersion` should match root

## Related Documentation

- [Contributing Guide](/development/contributing)
- [Commit Guidelines](/development/commit-guidelines)
- [API Documentation](/api/overview)
