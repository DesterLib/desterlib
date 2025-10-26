# Contributing to DesterLib

Thank you for your interest in contributing to DesterLib! 🎉

We welcome contributions from the community. This guide will help you get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Commit Guidelines](#commit-guidelines)
- [Changeset Guidelines](#changeset-guidelines)
- [Need Help?](#need-help)

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. By participating in this project, you agree to:

- Be respectful and inclusive
- Be patient and welcoming
- Be considerate of different viewpoints
- Focus on what's best for the community
- Show empathy towards other community members

**Unacceptable behavior includes:**
- Harassment, trolling, or discriminatory language
- Personal attacks or insults
- Publishing others' private information
- Other conduct inappropriate in a professional setting

Instances of unacceptable behavior may result in a temporary or permanent ban from the project.

## Getting Started

### Prerequisites

Before contributing, make sure you have:

- **Node.js** 18 or higher
- **pnpm** 9.0.0 or higher
- **Docker** (for testing database)
- **Git** for version control
- A **GitHub account**

### Find an Issue to Work On

1. Check [open issues](https://github.com/DesterLib/desterlib/issues)
2. Look for issues labeled `good first issue` or `help wanted`
3. Comment on the issue you want to work on
4. Wait for maintainer approval before starting work

**Not sure where to start?**
- Look for `good first issue` labels
- Fix typos or improve documentation
- Report bugs you've found
- Suggest new features in discussions

## Development Setup

### 1. Fork the Repository

Click the "Fork" button at the top right of the [DesterLib repository](https://github.com/DesterLib/desterlib).

### 2. Clone Your Fork

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/desterlib.git
cd desterlib

# Add upstream remote
git remote add upstream https://github.com/DesterLib/desterlib.git
```

### 3. Install Dependencies

```bash
# Install all dependencies
pnpm install
```

### 4. Set Up Development Database

```bash
# Start test database with Docker
docker-compose -f docker-compose.test.yml up -d

# Push database schema
cd apps/api
pnpm db:push
```

### 5. Start Development Server

```bash
# From repository root
pnpm dev

# Or run specific app
cd apps/api
pnpm dev
```

The API will be available at `http://localhost:3001`

### 6. Verify Setup

- Visit `http://localhost:3001/api/docs` for Swagger documentation
- Try making a test API request

## How to Contribute

### Workflow Overview

```
Fork → Clone → Create Branch → Make Changes → Commit → Push → Pull Request
```

### Step-by-Step Process

#### 1. Sync with Upstream

Always sync with the latest changes before starting new work:

```bash
# Fetch latest changes from upstream
git fetch upstream

# Switch to dev branch
git checkout dev

# Merge upstream changes
git merge upstream/dev

# Push to your fork
git push origin dev
```

#### 2. Create a Feature Branch

```bash
# Create branch from dev
git checkout dev
git checkout -b feat/your-feature-name

# For bug fixes
git checkout -b fix/bug-description

# For documentation
git checkout -b docs/what-you-update
```

**Branch naming conventions:**
- `feat/feature-name` - New features
- `fix/bug-name` - Bug fixes
- `docs/update-name` - Documentation updates
- `refactor/what-changed` - Code refactoring
- `perf/improvement-name` - Performance improvements
- `test/test-name` - Test additions/updates

#### 3. Make Your Changes

- Write clean, readable code
- Follow existing code style
- Add comments for complex logic
- Update documentation if needed
- Add tests for new features

#### 4. Test Your Changes

```bash
# Run linter
pnpm lint

# Check types
pnpm check-types

# Run tests (when available)
pnpm test

# Build to verify no errors
pnpm build
```

#### 5. Commit Your Changes

We use **conventional commits** for consistent commit messages:

```bash
# Use the interactive commit tool (recommended)
pnpm commit

# This will guide you through:
# - Type (feat, fix, docs, etc.)
# - Scope (api, database, etc.)
# - Description
# - Body (optional)
# - Breaking changes (if any)
```

**Manual commit format:**
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Examples:**
```bash
feat(api): add user search endpoint
fix(stream): resolve buffering issue on Safari
docs: update installation guide
refactor(database): simplify query logic
```

See [Commit Guidelines](apps/docs/src/content/docs/development/commit-guidelines.md) for more details.

#### 6. Create a Changeset

If your changes affect users (new features, bug fixes, breaking changes), create a changeset:

```bash
# Create changeset
pnpm changeset

# Follow the prompts:
# 1. Select affected packages (usually 'api')
# 2. Choose bump type (patch/minor/major)
# 3. Write a summary (appears in changelog)
```

**When to create a changeset:**
- ✅ New features
- ✅ Bug fixes
- ✅ Breaking changes
- ✅ Performance improvements
- ✅ Dependency updates affecting users

**When to skip changesets:**
- ❌ Documentation updates
- ❌ Internal refactoring
- ❌ Test additions
- ❌ CI/CD changes

**Commit the changeset:**
```bash
git add .changeset/
git commit -m "chore: add changeset"
```

#### 7. Push to Your Fork

```bash
# Push your branch to your fork
git push origin feat/your-feature-name
```

## Pull Request Process

### Creating a Pull Request

1. Go to [DesterLib repository](https://github.com/DesterLib/desterlib)
2. Click "Pull requests" → "New pull request"
3. Click "compare across forks"
4. Select:
   - **base repository:** `DesterLib/desterlib`
   - **base branch:** `dev`
   - **head repository:** `YOUR-USERNAME/desterlib`
   - **compare branch:** `feat/your-feature-name`
5. Click "Create pull request"
6. Fill out the PR template completely
7. Click "Create pull request"

### PR Checklist

Before submitting, ensure:

- [ ] Code follows project style guidelines
- [ ] Self-reviewed your own code
- [ ] Commented complex code sections
- [ ] Updated documentation if needed
- [ ] No new warnings generated
- [ ] Added changeset (if user-facing changes)
- [ ] Used conventional commits
- [ ] Tests pass (when available)
- [ ] Linter passes: `pnpm lint`
- [ ] Type check passes: `pnpm check-types`

### PR Review Process

1. **Automated Checks:** GitHub Actions will run:
   - Changeset validation
   - Linting
   - Type checking
   - Build verification

2. **Code Review:** Maintainers will review your PR:
   - Provide feedback and suggestions
   - Request changes if needed
   - Approve when ready

3. **Address Feedback:**
   ```bash
   # Make requested changes
   git add .
   pnpm commit
   git push origin feat/your-feature-name
   # PR updates automatically
   ```

4. **Merge:** Once approved, a maintainer will merge your PR to `dev`

### After Your PR is Merged

1. Sync your fork:
   ```bash
   git checkout dev
   git pull upstream dev
   git push origin dev
   ```

2. Delete your feature branch:
   ```bash
   git branch -d feat/your-feature-name
   git push origin --delete feat/your-feature-name
   ```

3. Celebrate! 🎉 You've contributed to DesterLib!

## Commit Guidelines

### Commit Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(api): add user search` |
| `fix` | Bug fix | `fix(auth): resolve JWT error` |
| `docs` | Documentation | `docs: update README` |
| `style` | Code style | `style: format with prettier` |
| `refactor` | Code refactoring | `refactor: simplify query` |
| `perf` | Performance | `perf: optimize caching` |
| `test` | Tests | `test: add auth tests` |
| `build` | Build system | `build: update deps` |
| `ci` | CI/CD | `ci: add workflow` |
| `chore` | Other changes | `chore: update gitignore` |

### Available Scopes

`api`, `database`, `websocket`, `stream`, `library`, `movies`, `tvshows`, `scan`, `settings`, `auth`, `middleware`, `config`, `deps`, `docker`, `ci`, `docs`, `release`

### Breaking Changes

If introducing breaking changes:

1. Add `!` after type/scope:
   ```
   feat(api)!: redesign authentication
   ```

2. Add `BREAKING CHANGE:` in footer:
   ```
   feat(api)!: redesign authentication
   
   BREAKING CHANGE: /auth/login endpoint removed.
   Use OAuth2 flow instead.
   ```

3. Create changeset with **major** bump

## Changeset Guidelines

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **Patch (0.0.X)** - Bug fixes, small changes
- **Minor (0.X.0)** - New features (backward-compatible)
- **Major (X.0.0)** - Breaking changes

### Creating Effective Changesets

**Good changeset summary:**
```
Add WebSocket support for real-time notifications

- New /ws endpoint for WebSocket connections
- Real-time event streaming
- Connection management utilities
```

**Bad changeset summary:**
```
updates
```

The changeset summary becomes the changelog entry that users read. Make it descriptive!

## Development Tips

### Code Style

- Use TypeScript strict mode
- Follow existing patterns in the codebase
- Keep functions small and focused
- Use meaningful variable names
- Add JSDoc comments for public APIs

### Testing

- Test your changes thoroughly
- Test edge cases
- Test error conditions
- Verify existing functionality still works

### Documentation

- Update docs for new features
- Add code comments for complex logic
- Update README if user-facing changes
- Include examples in docs

## Project Structure

```
desterlib/
├── apps/
│   ├── api/          # Backend API (Express + TypeScript)
│   └── docs/         # Documentation site (Starlight)
├── packages/
│   ├── eslint-config/       # Shared ESLint config
│   └── typescript-config/   # Shared TypeScript config
└── .changeset/       # Version management
```

See [Project Structure](apps/docs/src/content/docs/development/structure.md) for details.

## Need Help?

- 📖 [Documentation](http://localhost:4321) (run `cd apps/docs && pnpm dev`)
- 💬 [GitHub Discussions](https://github.com/DesterLib/desterlib/discussions)
- 🐛 [Report Issues](https://github.com/DesterLib/desterlib/issues)
- 📧 Contact maintainers through GitHub

## Recognition

All contributors will be recognized in our README and release notes. Thank you for helping make DesterLib better! ❤️

## License

By contributing to DesterLib, you agree that your contributions will be licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

This means:
- Your contributions will remain open source
- Derivatives must also be open source under AGPL-3.0
- Network use of the software requires source code sharing
- This protects the community and ensures DesterLib stays free and open

