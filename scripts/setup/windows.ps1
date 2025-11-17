# DesterLib Quick Setup Script for Windows
# Run this script to set up DesterLib without installing anything

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
║           🎬 DesterLib Quick Setup                        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
"@

# Function to check if command exists
function Test-CommandExists {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Check Docker
if (-not (Test-CommandExists "docker")) {
    Write-ColorOutput Red "❌ Docker is not installed."
    Write-ColorOutput Yellow "Please install Docker Desktop:"
    Write-ColorOutput Cyan "  https://www.docker.com/products/docker-desktop"
    exit 1
}

try {
    docker info | Out-Null
} catch {
    Write-ColorOutput Red "❌ Docker is not running."
    Write-ColorOutput Yellow "Please start Docker Desktop and try again."
    exit 1
}

if (-not (Test-CommandExists "docker-compose") -and -not (docker compose version 2>$null)) {
    Write-ColorOutput Red "❌ Docker Compose is not installed."
    exit 1
}

Write-ColorOutput Green "✅ Docker is installed and running"
Write-Output ""

# Get installation directory
$INSTALL_DIR = Join-Path $env:USERPROFILE ".desterlib"
Write-ColorOutput Cyan "Installation directory: $INSTALL_DIR"
$customDir = Read-Host "Press Enter to use default, or type a different path"
if ($customDir) {
    $INSTALL_DIR = $customDir
}

# Create installation directory
New-Item -ItemType Directory -Force -Path $INSTALL_DIR | Out-Null
Set-Location $INSTALL_DIR

# Get configuration
Write-Output ""
Write-ColorOutput Cyan "📋 Configuration"
Write-Output ""

# Media library path
Write-ColorOutput Cyan "Media library root path:"
Write-ColorOutput Yellow "  This should be the root directory containing your media libraries"
Write-ColorOutput Yellow "  Example: C:\Media (which contains Movies\, TV Shows\, etc.)"
$MEDIA_PATH = Read-Host "Media library root path"
if (-not $MEDIA_PATH) {
    Write-ColorOutput Red "❌ Media library path is required"
    exit 1
}
if (-not (Test-Path $MEDIA_PATH)) {
    Write-ColorOutput Yellow "⚠️  Warning: Media path does not exist: $MEDIA_PATH"
    $continueAnyway = Read-Host "Continue anyway? (y/N)"
    if ($continueAnyway -ne "y" -and $continueAnyway -ne "Y") {
        exit 1
    }
}

# Port
$PORT = Read-Host "API port [3001]"
if (-not $PORT) {
    $PORT = "3001"
}

# Database credentials
$DB_USER = Read-Host "Database user [postgres]"
if (-not $DB_USER) {
    $DB_USER = "postgres"
}

$securePassword = Read-Host "Database password [postgres]" -AsSecureString
$DB_PASSWORD = if ($securePassword.Length -eq 0) { "postgres" } else {
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

$DB_NAME = Read-Host "Database name [desterlib_prod]"
if (-not $DB_NAME) {
    $DB_NAME = "desterlib_prod"
}

Write-Output ""
Write-ColorOutput Cyan "📦 Setting up DesterLib..."

# Clone repository if not already there
if (-not (Test-Path ".git")) {
    Write-Output "Cloning DesterLib repository..."
    git clone --depth 1 --branch main https://github.com/DesterLib/desterlib.git temp_setup
    # Move files to current directory
    Get-ChildItem temp_setup | Move-Item -Destination . -Force
    Get-ChildItem temp_setup -Force | Where-Object { $_.Name -like ".*" } | Move-Item -Destination . -Force
    Remove-Item temp_setup -Recurse -Force
} else {
    Write-Output "Updating DesterLib repository..."
    git pull origin main
}

# Create .env file
Write-Output "Creating .env file..."
$envContent = @"
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public
NODE_ENV=production
PORT=${PORT}
FRONTEND_URL=http://localhost:${PORT}
# Media library path configuration (for path mapping between host and container)
HOST_MEDIA_PATH=${MEDIA_PATH}
CONTAINER_MEDIA_PATH=/media
"@
$envPath = Join-Path "apps" "api"
New-Item -ItemType Directory -Force -Path $envPath | Out-Null
$envContent | Out-File -FilePath (Join-Path $envPath ".env") -Encoding utf8 -NoNewline

# Update docker-compose.yml with user's configuration
Write-Output "Configuring docker-compose.yml..."

$dockerComposePath = "docker-compose.yml"
$dockerComposeContent = Get-Content $dockerComposePath -Raw

# Escape special regex characters
$escapedMediaPath = [regex]::Escape($MEDIA_PATH)
$escapedDbPassword = [regex]::Escape($DB_PASSWORD)

# Replace values
$dockerComposeContent = $dockerComposeContent -replace "/Volumes/External/Library/Media:/media:ro", "${MEDIA_PATH}:/media:ro"
$dockerComposeContent = $dockerComposeContent -replace '"0\.0\.0\.0:3001:3001"', "`"0.0.0.0:${PORT}:${PORT}`""
$dockerComposeContent = $dockerComposeContent -replace "PORT: 3001", "PORT: ${PORT}"
$dockerComposeContent = $dockerComposeContent -replace "POSTGRES_USER: postgres", "POSTGRES_USER: ${DB_USER}"
$dockerComposeContent = $dockerComposeContent -replace "POSTGRES_PASSWORD: postgres", "POSTGRES_PASSWORD: ${DB_PASSWORD}"
$dockerComposeContent = $dockerComposeContent -replace "POSTGRES_DB: desterlib_prod", "POSTGRES_DB: ${DB_NAME}"
$dockerComposeContent = $dockerComposeContent -replace "POSTGRES_USER:-postgres", "POSTGRES_USER:-${DB_USER}"
$dockerComposeContent = $dockerComposeContent -replace "postgres:postgres@postgres", "${DB_USER}:${DB_PASSWORD}@postgres"
$dockerComposeContent = $dockerComposeContent -replace "desterlib_prod", $DB_NAME
# Update HOST_MEDIA_PATH environment variable
$dockerComposeContent = $dockerComposeContent -replace "HOST_MEDIA_PATH: /Volumes/External/Library/Media", "HOST_MEDIA_PATH: ${MEDIA_PATH}"

$dockerComposeContent | Out-File -FilePath $dockerComposePath -Encoding utf8 -NoNewline

Write-ColorOutput Green "✅ Configuration files created"
Write-Output ""

# Build and start
Write-ColorOutput Cyan "🐳 Building and starting Docker containers..."
Write-Output "This may take a few minutes on first run..."
Write-Output ""

# Use docker compose (newer) or docker-compose (older)
if (docker compose version 2>$null) {
    $DOCKER_COMPOSE = "docker compose"
} else {
    $DOCKER_COMPOSE = "docker-compose"
}

& $DOCKER_COMPOSE.Split(' ') up -d --build

Write-Output ""
Write-ColorOutput Green "✅ DesterLib is starting up!"
Write-Output ""
Write-ColorOutput Cyan "📚 Your DesterLib server:"
Write-Output "  • API: http://localhost:${PORT}"
Write-Output "  • API Docs: http://localhost:${PORT}/api/docs"
Write-Output "  • Health: http://localhost:${PORT}/health"
Write-Output ""
Write-ColorOutput Cyan "📁 Installation directory: $INSTALL_DIR"
Write-Output ""
Write-ColorOutput Cyan "Useful commands:"
Write-Output "  cd $INSTALL_DIR"
Write-Output "  $DOCKER_COMPOSE logs -f     - View logs"
Write-Output "  $DOCKER_COMPOSE ps          - Check status"
Write-Output "  $DOCKER_COMPOSE restart     - Restart services"
Write-Output "  $DOCKER_COMPOSE down        - Stop services"
Write-Output ""
Write-ColorOutput Yellow "Note: It may take a minute for the API to be ready."
Write-Output ""

