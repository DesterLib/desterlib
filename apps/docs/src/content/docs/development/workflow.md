---
title: Development Workflow
description: Simple workflow for DesterLib development
---

Simple workflow for DesterLib development.

## 🚀 Daily Development Flow

### 1. Make Changes

```bash
# Create feature branch
git checkout main
git pull
git checkout -b feat/your-feature

# Make your changes
# ... edit files ...
```

### 2. Format & Commit

```bash
# Format code
pnpm format

# Commit (interactive)
pnpm commit
```

### 3. Add Changeset (if user-facing)

```bash
# For API changes, new features, bug fixes
pnpm changeset
# Select packages → Choose bump type → Write summary
git add .changeset
pnpm commit
```

### 4. Create PR

```bash
# Push branch
git push origin feat/your-feature

# Create PR (runs checks automatically)
pnpm pr:create
```

That's it! The `pnpm pr:create` command will:

- ✅ Run lint check
- ✅ Run type check
- ✅ Check formatting
- ✅ Verify versioning setup
- ✅ Create PR with GitHub CLI

## 📋 What Happens After PR Merge

### Automatic (CI/CD)

1. **Docs deploy** - Documentation automatically updates
2. **Changeset validation** - CI verifies changesets
3. **Version bump** - When ready, maintainers run `pnpm version` on `main`

### Manual (Maintainers Only)

```bash
# On main branch, after PRs are merged
pnpm version        # Bump versions, generate changelogs
pnpm release        # Build and publish (when ready)
```

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│ 1. Make Changes                                         │
│    git checkout -b feat/feature                         │
│    ... edit files ...                                   │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 2. Format & Commit                                      │
│    pnpm format                                          │
│    pnpm commit                                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 3. Add Changeset (if needed)                            │
│    pnpm changeset                                       │
│    git add .changeset                                   │
│    pnpm commit                                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 4. Create PR                                            │
│    git push origin feat/feature                         │
│    pnpm pr:create                                       │
│    └─ Runs: lint, types, format, versioning checks     │
│    └─ Creates PR on GitHub                              │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 5. Review & Merge                                       │
│    → CI runs checks                                     │
│    → Maintainer reviews                                 │
│    → PR merged to main                                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 6. Release (Maintainers)                                │
│    pnpm version    # Bump versions, generate changelogs │
│    pnpm release    # Build and publish                  │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Quick Reference

### Essential Commands

```bash
pnpm format           # Format code
pnpm commit           # Interactive commit
pnpm changeset        # Create changeset
pnpm pre-pr           # Run checks before PR
pnpm pr:create        # Create PR (includes checks)
```

### Versioning Commands (Maintainers)

```bash
pnpm changeset:status # Check changeset status
pnpm verify:versioning # Verify versioning setup
pnpm version          # Bump versions
pnpm changelog:sync   # Sync changelogs to docs
pnpm release          # Build and publish
```

### Development Commands

```bash
pnpm dev              # Start dev servers
pnpm build            # Build all packages
pnpm lint             # Lint code
pnpm check-types      # Type check
```

## ❓ When to Add a Changeset

### ✅ Add Changeset For:

- New features (minor bump)
- Bug fixes (patch bump)
- Breaking changes (major bump)
- API changes
- User-facing changes

### ❌ Skip Changeset For:

- Documentation only
- Internal refactoring
- Tests
- CI/CD changes
- Code style/formatting

## 🚨 Common Issues

### Pre-PR Checks Fail

```bash
# Fix linting
pnpm lint:fix

# Fix formatting
pnpm format

# Fix types
# Check TypeScript errors and fix

# Skip checks (not recommended)
pnpm pr:create --skip-checks
```

### No Changeset Needed

If your PR doesn't need versioning (docs, tests, etc.), just skip the changeset step. The checks will still pass.

## 📚 More Info

- [Contributing Guide](/development/contributing) - Detailed contribution guide
- [Versioning Guide](/development/versioning) - Version management details
- [Quick Reference](/development/quick-reference) - Common commands reference
