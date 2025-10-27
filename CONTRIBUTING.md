# Contributing to DesterLib

Thank you for your interest in contributing to DesterLib! 🎉

## 📖 Documentation

All contribution guidelines are maintained in the **DesterLib Documentation**:

👉 **[View Contributing Guide](https://desterlib.github.io/desterlib/development/contributing)**

The documentation covers:
- **General Guidelines** - Commit conventions, versioning, PR process (applies to all projects)
- **API Server Development** - Backend development setup
- **Client Development** - Mobile, desktop, and TV app development
- **Code Standards** - Style guides and best practices

## 🚀 Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/YOUR-USERNAME/desterlib.git
cd desterlib

# 2. Install dependencies
pnpm install

# 3. Start database
docker-compose -f docker-compose.test.yml up -d

# 4. Start API
cd apps/api
pnpm dev

# 5. Make commits
pnpm commit

# 6. Add changeset (for user-facing changes)
pnpm changeset

# 7. Push and create PR
```

## 📚 Additional Resources

- [API Server Overview](https://desterlib.github.io/desterlib/api/overview) - Backend development
- [Client Overview](https://desterlib.github.io/desterlib/clients/overview) - Client development
- [Project Structure](https://desterlib.github.io/desterlib/development/structure) - Codebase organization
- [Commit Guidelines](https://desterlib.github.io/desterlib/development/commit-guidelines) - Commit conventions
- [Versioning Guide](https://desterlib.github.io/desterlib/development/versioning) - Version management

## 💬 Need Help?

- 🐛 [Report Issues](https://github.com/DesterLib/desterlib/issues)
- 💬 [GitHub Discussions](https://github.com/DesterLib/desterlib/discussions)
- 📖 [Documentation](https://desterlib.github.io/desterlib)
- 📚 [API Docs](http://localhost:3001/api/docs) (when running locally)

## License

By contributing, you agree that your contributions will be licensed under the GNU Affero General Public License v3.0 (AGPL-3.0).
