---
title: Versioning Guide
description: How to track changes and manage releases with Changesets
---

This project uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation.

## Overview

We use **Changesets** to:
- Track changes across our monorepo packages
- Generate changelogs automatically
- Version packages based on changes
- Simplify the release process

Each significant change should have an associated changeset file that describes what changed and the impact level (patch, minor, or major).

## Branching Strategy

- **main** - Production-ready code, tagged releases
- **dev** - Development branch, all features merge here first
- **feat/** - Feature branches created from `dev`
- **fix/** - Bug fix branches created from `dev`
- **chore/** - Maintenance branches created from `dev`

## Making Changes

### 1. Create a feature branch

```bash
git checkout dev
git pull origin dev
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
   git checkout main
   git merge dev
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
git checkout dev
git pull origin dev
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
git checkout dev
git pull origin dev
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
git checkout dev
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

## Commands Reference

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

