# Scripts

Utility scripts for DesterLib.

## Scripts

- **sync-changelog.js** - Syncs package changelogs to docs
- **sync-version.js** - Syncs versions across packages
- **verify-versioning.js** - Verifies versioning setup
- **pre-pr-check.js** - Runs checks before creating PR
- **create-pr.sh** - Creates PR with GitHub CLI

## Usage

### Before PR

```bash
pnpm pre-pr          # Run all checks
pnpm pr:create       # Create PR with checks
```

### Versioning

```bash
pnpm verify:versioning  # Verify setup
pnpm changelog:sync     # Sync changelogs to docs
```
