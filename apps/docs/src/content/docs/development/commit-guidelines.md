---
title: Commit Guidelines
description: Conventional commit guidelines for DesterLib
---

This project uses [Conventional Commits](https://www.conventionalcommits.org/) for consistent commit messages.

## Making Commits

Use the interactive commit tool:

```bash
pnpm commit
```

This will guide you through creating a properly formatted commit message.

## Commit Message Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Type

The type must be one of the following:

| Type | Description | Example |
|------|-------------|---------|
| `feat` | ✨ A new feature | `feat(api): add user search endpoint` |
| `fix` | 🐛 A bug fix | `fix(auth): resolve JWT validation error` |
| `docs` | 📝 Documentation changes | `docs: update installation guide` |
| `style` | 💄 Code style changes | `style(api): format with prettier` |
| `refactor` | ♻️ Code refactoring | `refactor(db): simplify query logic` |
| `perf` | ⚡ Performance improvements | `perf(stream): optimize video buffering` |
| `test` | ✅ Adding or updating tests | `test(api): add auth integration tests` |
| `build` | 📦 Build system changes | `build: update dependencies` |
| `ci` | 👷 CI/CD changes | `ci: add automated release workflow` |
| `chore` | 🔧 Other changes | `chore: update gitignore` |
| `revert` | ⏪ Revert a commit | `revert: revert "feat: add feature"` |

### Scope

The scope is optional and represents the area of the codebase affected:

**Available scopes:**
- `api` - Backend API
- `database` - Database changes
- `websocket` - WebSocket functionality
- `stream` - Streaming features
- `library` - Library management
- `movies` - Movie-related features
- `tvshows` - TV show features
- `scan` - Media scanning
- `settings` - Settings functionality
- `auth` - Authentication
- `middleware` - Middleware
- `config` - Configuration
- `deps` - Dependencies
- `docker` - Docker configuration
- `ci` - CI/CD
- `docs` - Documentation
- `release` - Release management

You can also use custom scopes when needed.

### Subject

The subject contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No period (.) at the end
- Keep it under 100 characters

**Good examples:**
```
add user authentication
fix memory leak in stream handler
update API documentation
```

**Bad examples:**
```
Added user authentication (past tense)
Fix Memory Leak (capitalized)
updated API documentation. (period at end)
```

### Body

The body is optional and should include:
- Motivation for the change
- Contrast with previous behavior
- Implementation details (if complex)

Use `|` to break lines in the interactive commit tool.

### Footer

The footer is optional and should include:
- Breaking changes (prefixed with `BREAKING CHANGE:`)
- Issue references (e.g., `Closes #123`)

## Breaking Changes

Breaking changes must be indicated in two ways:

1. Add `!` after the type/scope:
   ```
   feat(api)!: redesign authentication API
   ```

2. Add `BREAKING CHANGE:` in the footer:
   ```
   feat(api)!: redesign authentication API

   Replace REST authentication with OAuth2 flow

   BREAKING CHANGE: The /auth/login endpoint has been removed.
   Use OAuth2 flow instead. See migration guide for details.
   ```

## Examples

### Feature Addition

```
feat(api): add user search endpoint

Implement search functionality for users with filters:
- Search by username
- Search by email
- Pagination support

Closes #42
```

### Bug Fix

```
fix(auth): resolve JWT validation error

Fix issue where expired tokens were not properly rejected,
causing 401 errors on valid requests.

Fixes #123
```

### Breaking Change

```
feat(api)!: redesign authentication API

Replace REST authentication endpoints with OAuth2 flow
for improved security and standards compliance.

BREAKING CHANGE: The following endpoints have been removed:
- POST /auth/login
- POST /auth/register

Use the new OAuth2 flow instead. See docs/migration.md for
migration guide.

Closes #56
```

### Documentation Update

```
docs: update versioning guide

Add examples for breaking changes and clarify
when to create changesets.
```

### Performance Improvement

```
perf(stream): optimize video buffering

Reduce initial buffering time by 50% through:
- Implement adaptive bitrate streaming
- Optimize chunk size
- Add memory caching layer
```

### Refactoring

```
refactor(database): simplify query logic

Extract common query patterns into reusable functions
to reduce code duplication and improve maintainability.
```

### Multiple Changes

If you have multiple logical changes, make separate commits:

```bash
# Commit 1
git add src/auth/
pnpm commit
# feat(auth): add OAuth2 support

# Commit 2
git add src/api/
pnpm commit
# docs(api): update authentication examples
```

## Commit Message Validation

Commits are automatically validated using commitlint. If your commit message doesn't follow the convention, you'll see an error:

```
⧗   input: Added new feature
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
```

## Best Practices

1. **Atomic commits** - One logical change per commit
2. **Clear subjects** - Describe what changed, not how
3. **Add context** - Use the body for complex changes
4. **Reference issues** - Link to relevant issues
5. **Break changes properly** - Always document breaking changes
6. **Test before committing** - Ensure tests pass
7. **Use the interactive tool** - `pnpm commit` helps you follow the format

## Resources

- [Conventional Commits Specification](https://www.conventionalcommits.org/)
- [Commitizen](https://github.com/commitizen/cz-cli)
- [Commitlint](https://commitlint.js.org/)
- [Versioning Guide](/development/versioning/)

