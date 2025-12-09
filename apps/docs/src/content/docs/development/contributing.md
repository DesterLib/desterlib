---
title: Contributing Guide
description: How to contribute to DesterLib - applies to all projects
---

Thank you for your interest in contributing to DesterLib! This guide will help you get started with contributing to the project.

:::note[Applies to All Projects]
This guide applies to **all DesterLib projects**:

- **API Server** - Backend and API development
- **Client Applications** - Mobile, desktop, and TV apps
- **Documentation** - This documentation site

For project-specific setup:

- [API Server Setup](/api/overview)
- [Client Development](/clients/overview)
  :::

## 🎯 Quick Start

New to DesterLib? Here's the fastest way to start contributing:

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create a branch** for your changes
4. **Make your changes** and commit with `pnpm commit`
5. **Add a changeset** with `pnpm changeset` (if needed)
6. **Push** to your fork and create a **Pull Request**

:::tip[First Time Contributing?]
Check out our [CONTRIBUTING.md](https://github.com/DesterLib/desterlib/blob/main/CONTRIBUTING.md) for detailed step-by-step instructions!
:::

## 🚀 For Community Contributors

If you don't have write access to the repository, follow the **fork workflow**:

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR-USERNAME/desterlib.git
cd desterlib

# Add upstream remote
git remote add upstream https://github.com/DesterLib/desterlib.git
```

### 2. Sync with Upstream

Before starting new work, always sync:

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

### 3. Create Feature Branch

```bash
# Create branch from main
git checkout main
git checkout -b feat/your-feature-name
```

### 4. Make Changes & Commit

```bash
# Make your changes, then:
pnpm commit
# Follow the interactive prompts
```

### 5. Add Changeset (if needed)

For user-facing changes:

```bash
pnpm changeset
# Select packages and bump type
# Write a clear summary
git add .changeset/
git commit -m "chore: add changeset"
```

### 6. Push to Your Fork

```bash
git push origin feat/your-feature-name
```

### 7. Create Pull Request

1. Go to the [DesterLib repository](https://github.com/DesterLib/desterlib)
2. Click "Pull requests" → "New pull request"
3. Click "compare across forks"
4. Select:
   - **base:** `DesterLib/desterlib` / `main`
   - **head:** `YOUR-USERNAME/desterlib` / `feat/your-feature-name`
5. Fill out the PR template
6. Submit!

## 👥 For Core Team Members

If you have write access to the repository:

### Workflow

```bash
# Clone the repo
git clone https://github.com/DesterLib/desterlib.git
cd desterlib

# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feat/your-feature-name

# Make changes, commit, add changeset
pnpm commit
pnpm changeset

# Push to origin
git push -u origin feat/your-feature-name

# Create PR using script (targets main by default)
pnpm pr:create
```

:::note[Alpha Development]
During alpha development, we use a simplified workflow: **Feature Branches → Main**. Once we reach stable releases, we'll introduce a `dev` branch for staging.
:::

## 🔍 Finding Issues to Work On

### Good First Issues

Look for issues labeled:

- `good first issue` - Perfect for newcomers
- `help wanted` - Community help needed
- `documentation` - Improve docs

### Before Starting Work

1. **Comment on the issue** to let maintainers know you're interested
2. **Wait for approval** before starting work
3. **Ask questions** if anything is unclear

Don't see an issue you want? Create one!

## 📋 Contribution Types

### Code Contributions

- ✨ **New features** - Add functionality
- 🐛 **Bug fixes** - Fix issues
- ⚡ **Performance** - Optimize code
- ♻️ **Refactoring** - Improve code quality

**Requirements:**

- Follow code style guidelines
- Add tests if possible
- Update documentation
- Create a changeset

### Documentation Contributions

- 📝 **Improve docs** - Fix typos, clarify content
- 📖 **Add examples** - Show how to use features
- 🎓 **Tutorials** - Create guides
- 🌍 **Translations** - Help internationalize

**Requirements:**

- Clear and concise writing
- Accurate information
- Proper formatting
- No changeset needed for docs-only

### Testing Contributions

- ✅ **Add tests** - Increase coverage
- 🧪 **Improve tests** - Better assertions
- 🔧 **Fix flaky tests** - Improve reliability

**Requirements:**

- Tests pass locally
- Follow existing test patterns

### Design Contributions

- 🎨 **UI improvements** - Better user interface
- 💄 **Style updates** - Visual enhancements
- 🖼️ **Assets** - Icons, images, etc.

**Requirements:**

- Match existing design language
- Responsive design
- Accessibility considerations

## ✅ Pull Request Checklist

Before submitting your PR, verify:

- [ ] Code follows project style (`pnpm lint`)
- [ ] Type checking passes (`pnpm check-types`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Commits follow conventional format (`pnpm commit`)
- [ ] Changeset added (if user-facing changes)
- [ ] Documentation updated (if needed)
- [ ] PR template filled out completely
- [ ] Tests pass (when available)
- [ ] No merge conflicts with `main`

## 📝 Commit Message Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Examples

```bash
feat(api): add user search endpoint
fix(stream): resolve buffering on Safari
docs: update contributing guide
refactor(database): simplify queries
perf(api): optimize video encoding
```

### Using the Interactive Tool

```bash
pnpm commit
# Follow the prompts - it's easy!
```

## 🦋 When to Add a Changeset

### ✅ Add Changeset For:

- New features (minor bump)
- Bug fixes (patch bump)
- Breaking changes (major bump)
- Performance improvements (patch/minor)
- Dependency updates affecting users (patch)

### ❌ Skip Changeset For:

- Documentation changes
- Internal refactoring (no API changes)
- Test additions/updates
- CI/CD changes
- Code style/formatting

### Creating a Changeset

```bash
pnpm changeset

# Select packages: Usually 'api'
# Choose bump type:
#   - patch (0.0.X) for bug fixes
#   - minor (0.X.0) for features
#   - major (X.0.0) for breaking changes
# Write clear summary (becomes changelog)
```

## 🔄 PR Review Process

### 1. Automated Checks

GitHub Actions will automatically:

- Validate changesets
- Run linters
- Check types
- Verify builds

### 2. Code Review

Maintainers will:

- Review your code
- Provide feedback
- Request changes (if needed)
- Approve when ready

### 3. Address Feedback

Make requested changes:

```bash
# Make changes locally
git add .
pnpm commit
git push origin feat/your-feature-name
# PR updates automatically
```

### 4. Merge

Once approved:

- Maintainer merges to `main`
- Your contribution is part of DesterLib!
- Docs automatically deploy to GitHub Pages
- Celebrate! 🎉

## 🌟 After Your PR is Merged

### Update Your Fork

```bash
git checkout main
git pull upstream main
git push origin main
```

### Clean Up

```bash
# Delete local branch
git branch -d feat/your-feature-name

# Delete remote branch
git push origin --delete feat/your-feature-name
```

## 📚 Additional Resources

- [Project Structure](/development/structure/) - Codebase organization

## 💬 Getting Help

Need assistance?

- 💭 [GitHub Discussions](https://github.com/DesterLib/desterlib/discussions) - Ask questions
- 🐛 [GitHub Issues](https://github.com/DesterLib/desterlib/issues) - Report bugs
- 📖 [Full Contributing Guide](https://github.com/DesterLib/desterlib/blob/main/CONTRIBUTING.md) - Detailed instructions

## 🎉 Recognition

All contributors are recognized in:

- Project README
- Release notes
- GitHub contributors page

Thank you for helping make DesterLib better! ❤️

## Code of Conduct

We are committed to providing a welcoming and inclusive community. Be respectful, patient, and considerate of others.

**Expected behavior:**

- Be welcoming and inclusive
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

**Unacceptable behavior:**

- Harassment or discriminatory language
- Personal attacks or insults
- Publishing others' private information
- Other unprofessional conduct

Violations may result in temporary or permanent ban from the project.

## License

By contributing, you agree that your contributions will be licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).

This ensures DesterLib remains free and open source, with all derivatives also remaining open source.
