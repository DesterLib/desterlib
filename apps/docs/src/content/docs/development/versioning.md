---
title: Versioning Guide
description: How to track changes and manage releases across all DesterLib projects
---

DesterLib uses different versioning tools for different projects, but all follow semantic versioning and conventional commits.

## Overview by Project

### API Server (Node.js/TypeScript)
Uses **[Changesets](https://github.com/changesets/changesets)** to:
- Track changes across monorepo packages
- Generate changelogs automatically
- Version packages based on changes
- Simplify the release process

### Client Applications (Flutter/Dart)
Uses **conventional-changelog** to:
- Generate changelogs from commit history
- Automate version bumping in `pubspec.yaml`
- Create releases with automated builds
- Maintain semantic versioning

---

## Semantic Versioning

All projects follow [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH

API Server:     1.2.3
Client (Flutter): 1.2.3+4  (includes build number)
```

| Version | When to Bump | Example |
|---------|-------------|---------|
| **MAJOR** | Breaking changes | 0.9.0 → 1.0.0 |
| **MINOR** | New features (backward-compatible) | 1.0.0 → 1.1.0 |
| **PATCH** | Bug fixes | 1.1.0 → 1.1.1 |
| **BUILD** | Flutter only - build number | 1.1.0+1 → 1.1.0+2 |

---

## API Server Versioning (Changesets)

Each significant change should have an associated changeset file that describes what changed and the impact level (patch, minor, or major).

## Branching Strategy

:::note[Alpha Development Workflow]
During alpha development, we use a simplified workflow. Once we reach stable releases (v1.0.0), we'll introduce a `dev` branch for staging.
:::

- **main** - Production code, auto-deploys docs, tagged releases
- **feat/** - Feature branches created from `main`
- **fix/** - Bug fix branches created from `main`
- **chore/** - Maintenance branches created from `main`
- **docs/** - Documentation branches created from `main`

## Making Changes

### 1. Create a feature branch

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

### 2. Make your changes

Write your code, tests, and documentation.

### 3. Commit using conventional commits

```bash
pnpm commit
```

This will guide you through creating a properly formatted commit message.

### 4. Create a changeset

See the [Creating a Changeset](#creating-a-changeset) section below.

## Creating a Changeset

After making changes that affect users, create a changeset:

```bash
pnpm changeset
```

Or:
```bash
pnpm changeset:add
```

This will prompt you to:
1. **Select packages** that were changed
2. **Choose bump type** (patch, minor, or major) for each package
3. **Write a summary** of the changes (this will appear in the changelog)

### Example Changeset Flow

```bash
$ pnpm changeset

🦋  Which packages would you like to include?
◉ api
◯ @repo/eslint-config
◯ @repo/typescript-config

🦋  Which packages should have a major bump?
◯ api

🦋  Which packages should have a minor bump?
◉ api

🦋  Please enter a summary for this change:
Add WebSocket support for real-time notifications

✔ Changeset added! - see .changeset/random-words-here.md
```

### When to Create Changesets

**Create a changeset for:**
- ✅ New features
- ✅ Bug fixes
- ✅ Breaking changes
- ✅ Performance improvements
- ✅ Dependency updates that affect users

**Skip changesets for:**
- ❌ Documentation updates
- ❌ Internal refactoring (no API changes)
- ❌ Test additions/updates
- ❌ CI/CD changes

## Version Bump Types

Follow [Semantic Versioning](https://semver.org/) (SemVer):

### Patch (0.0.X)

Bug fixes and minor changes that don't affect the API:
- Bug fixes
- Documentation updates
- Internal refactoring
- Performance improvements (non-breaking)

**Example:** `1.2.3` → `1.2.4`

### Minor (0.X.0)

New features that are backward-compatible:
- New features
- New API endpoints
- New optional parameters
- Deprecations (with backward compatibility)

**Example:** `1.2.3` → `1.3.0`

### Major (X.0.0)

Breaking changes that require users to modify their code:
- Breaking API changes
- Removed features
- Changed behavior of existing features
- Required parameter changes

**Example:** `1.2.3` → `2.0.0`

## Versioning Packages

When you're ready to create a new version:

### 1. Check changeset status

```bash
pnpm changeset:status
```

### 2. Apply version bumps

```bash
pnpm version
```

This command will:
- Read all changeset files in `.changeset/`
- Bump package versions according to semantic versioning
- Update `CHANGELOG.md` files
- Delete consumed changeset files
- Update lockfile

### 3. Review the changes

- Check updated `package.json` files
- Review generated `CHANGELOG.md` entries
- Verify version numbers are correct

### 4. Commit version changes

```bash
git add .
git commit -m "chore: version packages"
git push
```

## Publishing Releases

### Manual Release

1. Merge to main:
   ```bash
   # Not needed in alpha - PRs merge directly to main
   # In the future with dev branch:
   # git checkout main
   # git merge dev
   ```

2. Build and publish:
   ```bash
   pnpm release
   ```

3. Push with tags:
   ```bash
   git push --follow-tags
   ```

### Automated Release (Recommended)

GitHub Actions automatically handles releases:

1. Merge PR to `main` that contains version bump commits
2. GitHub Action automatically:
   - Builds packages
   - Publishes to npm (if configured)
   - Creates GitHub releases
   - Tags commits

## Workflow Examples

### Example 1: Adding a Feature

```bash
# 1. Create feature branch
git checkout main
git pull origin main
git checkout -b feat/add-user-search

# 2. Make changes
# ... code changes ...

# 3. Commit changes
git add .
pnpm commit
# Select: feat
# Scope: api
# Description: add user search endpoint

# 4. Create changeset
pnpm changeset
# Select: api
# Bump: minor
# Summary: Add user search endpoint with filters

# 5. Commit changeset
git add .
git commit -m "chore: add changeset for user search"

# 6. Push and create PR
git push -u origin feat/add-user-search
```

### Example 2: Fixing a Bug

```bash
# 1. Create fix branch
git checkout main
git pull origin main
git checkout -b fix/authentication-error

# 2. Fix the bug
# ... code changes ...

# 3. Commit fix
git add .
pnpm commit
# Select: fix
# Scope: api
# Description: resolve JWT token validation error

# 4. Create changeset
pnpm changeset
# Select: api
# Bump: patch
# Summary: Fix JWT token validation error causing 401s

# 5. Commit changeset
git add .
git commit -m "chore: add changeset for auth fix"

# 6. Push and create PR
git push -u origin fix/authentication-error
```

### Example 3: Breaking Change

```bash
# 1. Create feature branch
git checkout main
git checkout -b feat/api-v2-breaking

# 2. Make breaking changes
# ... code changes ...

# 3. Commit with breaking change marker
git add .
pnpm commit
# Select: feat
# Scope: api
# Description: redesign authentication API
# Breaking change?: Yes

# 4. Create changeset with major bump
pnpm changeset
# Select: api
# Bump: major
# Summary: |
#   BREAKING CHANGE: Redesign authentication API
#   
#   - Replace /auth/login with OAuth2 flow
#   - Remove /auth/register endpoint
#   - Update response format

# 5. Commit and push
git add .
git commit -m "chore: add changeset for breaking change"
git push -u origin feat/api-v2-breaking
```

---

## Client Versioning (Flutter)

The Flutter client uses a simpler, automated workflow with `conventional-changelog`.

### Quick Workflow

```bash
# 1. Work on feature branch
git checkout -b feat/subtitle-support
# ... make changes ...
npm run commit  # Conventional commits

# 2. Create PR, get it merged to main

# 3. After merge, create release from main
git checkout main
git pull origin main
npm run release  # Interactive script
```

### Release Script

The `npm run release` command:
1. ✅ Checks you're on `main` branch
2. ✅ Shows current version
3. ✅ Prompts for bump type (patch/minor/major/build)
4. ✅ Updates `pubspec.yaml`
5. ✅ Generates changelog from commits
6. ✅ Creates release commit and tag
7. ✅ Prompts you to push

### Version Format

```yaml
version: 1.2.3+4
#         │ │ │ │
#         │ │ │ └─ Build number (auto-incremented)
#         │ │ └─── PATCH
#         │ └───── MINOR
#         └─────── MAJOR
```

### Automated Builds

When you push a tag, GitHub Actions automatically:
- Creates GitHub Release with changelog
- Builds for all platforms (Android, iOS, macOS, Linux, Windows)
- Attaches builds to the release

### Example: Feature Release

```bash
# After PRs are merged to main
git checkout main
git pull origin main

# Run release script
npm run release

# Interactive prompts:
# Current version: 0.1.5+3
# Select version bump type:
#   1) Patch (bug fixes)         - 0.1.5 → 0.1.6+1
#   2) Minor (new features)      - 0.1.5 → 0.2.0+1
#   3) Major (breaking changes)  - 0.1.5 → 1.0.0+1
# 
# Enter choice: 2

# Changelog is generated from commits:
# ## [0.2.0] - 2024-10-27
# 
# ### Features
# * **player:** add subtitle support
# * **ui:** add dark mode theme
# 
# ### Bug Fixes
# * **auth:** resolve token refresh

# Confirm and push
git push origin main --tags

# Check: https://github.com/DesterLib/desterlib-flutter/releases
```

### Client Commands Reference

| Command | Description |
|---------|-------------|
| `npm run commit` | Create conventional commit |
| `npm run release` | Interactive release (must be on main) |
| `npm run version:bump patch` | Manual version bump |
| `npm run changelog:generate` | Generate changelog only |

---

## API Commands Reference

| Command | Description |
|---------|-------------|
| `pnpm changeset` | Create a new changeset |
| `pnpm changeset:add` | Alias for `pnpm changeset` |
| `pnpm changeset:status` | Check which packages will be versioned |
| `pnpm version` | Apply version bumps and update changelogs |
| `pnpm release` | Build and publish packages |

## Best Practices

1. **Write clear changeset summaries** - They become your changelog entries
2. **Create changesets per feature** - Don't bundle multiple features
3. **Version frequently** - Don't let changesets pile up
4. **Review generated CHANGELOGs** - Make sure they're clear for users
5. **Use conventional commits** - Makes history easier to understand

## Additional Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Quick Reference](/development/quick-reference/) for a shorter guide

