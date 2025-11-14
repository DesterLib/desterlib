# @desterlib/cli

Command-line tool for setting up DesterLib with Docker.

## Installation

### Option 1: Quick Install (No Node.js Required)

**macOS/Linux:**

```bash
curl -fsSL https://raw.githubusercontent.com/DesterLib/desterlib/main/packages/cli/install.sh | bash
```

**Windows (PowerShell):**

```powershell
iwr -useb https://raw.githubusercontent.com/DesterLib/desterlib/main/packages/cli/install.ps1 | iex
```

The installer will automatically:

- Check for Node.js 18+
- Install Node.js if needed (via nvm, package manager, or Chocolatey/winget)
- Install the DesterLib CLI globally

### Option 2: Using npx (No Installation)

```bash
npx @desterlib/cli
```

### Option 3: Install via npm (Requires Node.js)

```bash
npm install -g @desterlib/cli
```

### Option 4: Standalone Binary

Download pre-built binaries from [GitHub Releases](https://github.com/DesterLib/desterlib/releases) (coming soon).

Or build from source:

```bash
cd packages/cli
pnpm install
pnpm build:binary:all
# Binaries will be in dist/bin/
```

## Usage

```bash
# Run the setup wizard
desterlib

# Or explicitly
desterlib setup

# Check for updates
desterlib update-check
```

## Documentation

📖 **[Full CLI Documentation](https://desterlib.github.io/desterlib/cli/overview)**

For detailed usage, configuration, and more, visit the [documentation site](https://desterlib.github.io/desterlib/cli/overview).
