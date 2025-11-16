# DesterLib CLI Installer for Windows
# This script installs the DesterLib CLI without requiring Node.js to be pre-installed

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

# Banner
Write-ColorOutput Cyan @"
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🎬 DesterLib CLI Installer                      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@

# Function to check if command exists
function Test-CommandExists {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Function to check Node.js version
function Test-NodeVersion {
    if (Test-CommandExists "node") {
        $nodeVersion = (node -v) -replace 'v', '' -split '\.' | Select-Object -First 1
        if ([int]$nodeVersion -ge 18) {
            return $true
        }
    }
    return $false
}

# Function to install Node.js via Chocolatey
function Install-NodeViaChocolatey {
    Write-ColorOutput Yellow "📦 Installing Node.js via Chocolatey..."
    
    if (-not (Test-CommandExists "choco")) {
        Write-ColorOutput Yellow "Installing Chocolatey..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
    
    choco install nodejs-lts -y
    Write-ColorOutput Green "✅ Node.js installed successfully"
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

# Function to install Node.js via winget
function Install-NodeViaWinget {
    Write-ColorOutput Yellow "📦 Installing Node.js via winget..."
    
    if (-not (Test-CommandExists "winget")) {
        Write-ColorOutput Red "❌ winget is not available. Please install Node.js manually."
        Write-ColorOutput Yellow "Download from: https://nodejs.org/"
        exit 1
    }
    
    winget install OpenJS.NodeJS.LTS
    Write-ColorOutput Green "✅ Node.js installed successfully"
    
    # Refresh environment variables
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

# Check if Node.js is installed
if (-not (Test-NodeVersion)) {
    Write-ColorOutput Yellow "⚠️  Node.js 18+ is required but not found."
    Write-Output ""
    Write-ColorOutput Cyan "Choose installation method:"
    Write-Output "  1) Install via Chocolatey (requires admin)"
    Write-Output "  2) Install via winget (Windows 10/11)"
    Write-Output "  3) Install manually (exit and install from https://nodejs.org/)"
    Write-Output ""
    $choice = Read-Host "Enter choice [1-3]"
    
    switch ($choice) {
        "1" {
            Install-NodeViaChocolatey
        }
        "2" {
            Install-NodeViaWinget
        }
        "3" {
            Write-ColorOutput Yellow "Please install Node.js 18+ and run this script again."
            exit 0
        }
        default {
            Write-ColorOutput Red "Invalid choice. Exiting."
            exit 1
        }
    }
}

# Verify Node.js installation
if (-not (Test-NodeVersion)) {
    Write-ColorOutput Red "❌ Node.js 18+ is still not available."
    Write-ColorOutput Yellow "Please restart your terminal and try again, or install Node.js manually."
    exit 1
}

$nodeVersion = node -v
$npmVersion = npm -v
Write-ColorOutput Green "✅ Node.js $nodeVersion and npm $npmVersion detected"

# Check if git is available
if (-not (Test-CommandExists "git")) {
    Write-ColorOutput Red "❌ Git is required but not found."
    Write-ColorOutput Yellow "Please install Git and run this script again."
    Write-ColorOutput Cyan "   https://git-scm.com/downloads"
    exit 1
}

# Install CLI globally from GitHub
Write-Output ""
Write-ColorOutput Cyan "📦 Installing DesterLib CLI from GitHub..."

# Create temporary directory
$TempDir = New-TemporaryFile | ForEach-Object { Remove-Item $_; New-Item -ItemType Directory -Path $_ }

try {
    # Clone repository
    Write-ColorOutput Cyan "Cloning repository..."
    $cloneResult = git clone --depth 1 --branch main https://github.com/DesterLib/desterlib.git "$TempDir\desterlib" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Failed to clone repository."
        exit 1
    }
    
    # Navigate to CLI package and install
    Push-Location "$TempDir\desterlib\packages\cli"
    
    # Install dependencies and build
    Write-ColorOutput Cyan "Building CLI..."
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Failed to install dependencies."
        exit 1
    }
    
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Failed to build CLI."
        exit 1
    }
    
    # Install globally
    Write-ColorOutput Cyan "Installing CLI globally..."
    npm install -g .
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Failed to install CLI globally."
        exit 1
    }
    
    Pop-Location
} catch {
    Write-ColorOutput Red "❌ Error during installation: $_"
    exit 1
} finally {
    # Clean up
    Remove-Item -Recurse -Force $TempDir -ErrorAction SilentlyContinue
}

# Verify installation
if (Test-CommandExists "desterlib") {
    Write-Output ""
    Write-ColorOutput Green "✅ DesterLib CLI installed successfully!"
    Write-Output ""
    Write-ColorOutput Cyan "You can now run:"
    Write-ColorOutput Green "  desterlib        - Run the setup wizard"
    Write-ColorOutput Green "  desterlib setup  - Run the setup wizard"
    Write-Output ""
    Write-ColorOutput Cyan "To update the CLI in the future, run this installer again."
    Write-Output ""
} else {
    Write-ColorOutput Red "❌ Installation completed but 'desterlib' command not found."
    Write-ColorOutput Yellow "Please check your PATH or restart your terminal."
    exit 1
}

