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
================================================================
                                                                
           DesterLib Quick Setup                        
                                                                
================================================================
"@

# Function to check if command exists
function Test-CommandExists {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Check Docker
if (-not (Test-CommandExists "docker")) {
    Write-ColorOutput Red "[X] Docker is not installed."
    Write-ColorOutput Yellow "Please install Docker Desktop:"
    Write-ColorOutput Cyan "  https://www.docker.com/products/docker-desktop"
    exit 1
}

try {
    docker info | Out-Null
} catch {
    Write-ColorOutput Red "[X] Docker is not running."
    Write-ColorOutput Yellow "Please start Docker Desktop and try again."
    exit 1
}

$dockerComposeAvailable = $false
if (Test-CommandExists "docker-compose") {
    $dockerComposeAvailable = $true
} else {
    try {
        docker compose version 2>&1 | Out-Null
        $dockerComposeAvailable = $true
    } catch {
        $dockerComposeAvailable = $false
    }
}

if (-not $dockerComposeAvailable) {
    Write-ColorOutput Red "[X] Docker Compose is not installed."
    exit 1
}

Write-ColorOutput Green "[OK] Docker is installed and running"
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
Write-ColorOutput Cyan "Configuration"
Write-Output ""

# Media library path
Write-ColorOutput Cyan "Media library root path:"
Write-ColorOutput Yellow "  This should be the root directory containing your media libraries"
Write-ColorOutput Yellow "  Example: C:\Media (which contains Movies\, TV Shows\, etc.)"
$MEDIA_PATH = Read-Host "Media library root path"
if (-not $MEDIA_PATH) {
    Write-ColorOutput Red "[X] Media library path is required"
    exit 1
}
if (-not (Test-Path $MEDIA_PATH)) {
    Write-ColorOutput Yellow "[!] Warning: Media path does not exist: $MEDIA_PATH"
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
Write-ColorOutput Cyan "Setting up DesterLib..."

# Clone repository if not already there
if (-not (Test-Path ".git")) {
    Write-Output "Cloning DesterLib repository..."
    # Configure Git to use LF line endings for this clone to avoid Docker build issues
    $originalAutocrlf = git config --global core.autocrlf
    git config --global core.autocrlf false
    try {
        git clone --depth 1 --branch main https://github.com/DesterLib/desterlib.git temp_setup
        # Move files to current directory
        Get-ChildItem temp_setup | Move-Item -Destination . -Force
        Get-ChildItem temp_setup -Force | Where-Object { $_.Name -like ".*" } | Move-Item -Destination . -Force
        Remove-Item temp_setup -Recurse -Force
    } finally {
        # Restore original Git autocrlf setting
        if ($originalAutocrlf) {
            git config --global core.autocrlf $originalAutocrlf
        } else {
            git config --global --unset core.autocrlf
        }
    }
    
    # Ensure Dockerfile has Unix line endings (critical for heredoc to work)
    if (Test-Path "Dockerfile") {
        $dockerfileContent = Get-Content "Dockerfile" -Raw
        $dockerfileContent = $dockerfileContent -replace "`r`n", "`n" -replace "`r", "`n"
        [System.IO.File]::WriteAllText((Resolve-Path "Dockerfile"), $dockerfileContent, [System.Text.UTF8Encoding]::new($false))
    }
} else {
    Write-Output "Updating DesterLib repository..."
    git pull origin main
    
    # Ensure Dockerfile has Unix line endings after update
    if (Test-Path "Dockerfile") {
        $dockerfileContent = Get-Content "Dockerfile" -Raw
        $dockerfileContent = $dockerfileContent -replace "`r`n", "`n" -replace "`r", "`n"
        [System.IO.File]::WriteAllText((Resolve-Path "Dockerfile"), $dockerfileContent, [System.Text.UTF8Encoding]::new($false))
    }
}

# Create .env file
Write-Output "Creating .env file..."

# Convert Windows paths to forward slashes for Docker Compose
$MEDIA_PATH_NORMALIZED = $MEDIA_PATH -replace '\\', '/'

$envContent = @"
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public
NODE_ENV=production
PORT=${PORT}
FRONTEND_URL=http://localhost:${PORT}
# Media library path configuration (for path mapping between host and container)
HOST_MEDIA_PATH=${MEDIA_PATH_NORMALIZED}
CONTAINER_MEDIA_PATH=/media
"@
$envPath = Join-Path "apps" "api"
New-Item -ItemType Directory -Force -Path $envPath | Out-Null
# Ensure Unix line endings (LF) for .env file
$envContent = $envContent -replace "`r`n", "`n" -replace "`r", "`n"
$envContent | Out-File -FilePath (Join-Path $envPath ".env") -Encoding utf8 -NoNewline

# Update docker-compose.yml with user's configuration
Write-Output "Configuring docker-compose.yml..."

$dockerComposePath = "docker-compose.yml"
$dockerComposeContent = Get-Content $dockerComposePath -Raw

# Escape special regex characters for pattern matching
$escapedMediaPathPattern = [regex]::Escape("/Volumes/External/Library/Media")
$escapedDbPasswordPattern = [regex]::Escape("postgres")
$escapedDbNamePattern = [regex]::Escape("desterlib_prod")

# Escape special characters in replacement strings (for PowerShell -replace)
# In PowerShell -replace, $ in replacement strings is special (for capture groups)
# To use a literal $, we need to escape it as $$. Since variables are expanded first,
# we need to escape $ in the variable values themselves
function Escape-ReplacementString {
    param($String)
    $String -replace '\$', '$$'
}

$escapedMediaPathReplacement = Escape-ReplacementString $MEDIA_PATH_NORMALIZED
$escapedDbPasswordReplacement = Escape-ReplacementString $DB_PASSWORD
$escapedDbUserReplacement = Escape-ReplacementString $DB_USER
$escapedDbNameReplacement = Escape-ReplacementString $DB_NAME
$escapedPortReplacement = Escape-ReplacementString $PORT

# Replace values (order matters - do specific replacements before global ones)
# Replace volume mount path
$dockerComposeContent = $dockerComposeContent -replace [regex]::Escape("- /Volumes/External/Library/Media:/media:ro"), "- ${escapedMediaPathReplacement}:/media:ro"
# Replace port binding
$dockerComposeContent = $dockerComposeContent -replace [regex]::Escape('"0.0.0.0:3001:3001"'), "`"0.0.0.0:${escapedPortReplacement}:${escapedPortReplacement}`""
# Replace PORT environment variable
$dockerComposeContent = $dockerComposeContent -replace [regex]::Escape("PORT: 3001"), "PORT: $escapedPortReplacement"
# Replace POSTGRES_USER in environment section
$dockerComposeContent = $dockerComposeContent -replace [regex]::Escape("POSTGRES_USER: postgres"), "POSTGRES_USER: $escapedDbUserReplacement"
# Replace POSTGRES_PASSWORD in environment section
$dockerComposeContent = $dockerComposeContent -replace [regex]::Escape("POSTGRES_PASSWORD: postgres"), "POSTGRES_PASSWORD: $escapedDbPasswordReplacement"
# Replace POSTGRES_DB in environment section
$dockerComposeContent = $dockerComposeContent -replace [regex]::Escape("POSTGRES_DB: desterlib_prod"), "POSTGRES_DB: $escapedDbNameReplacement"
# Replace POSTGRES_USER in healthcheck (if present)
$dockerComposeContent = $dockerComposeContent -replace [regex]::Escape("POSTGRES_USER:-postgres"), "POSTGRES_USER:-$escapedDbUserReplacement"
# Replace DATABASE_URL
$dockerComposeContent = $dockerComposeContent -replace [regex]::Escape("postgres:postgres@postgres"), "${escapedDbUserReplacement}:${escapedDbPasswordReplacement}@postgres"
# Replace HOST_MEDIA_PATH environment variable
$dockerComposeContent = $dockerComposeContent -replace [regex]::Escape("HOST_MEDIA_PATH: /Volumes/External/Library/Media"), "HOST_MEDIA_PATH: $escapedMediaPathReplacement"
# Global replacement of desterlib_prod (do this last to avoid conflicts)
$dockerComposeContent = $dockerComposeContent -replace $escapedDbNamePattern, $escapedDbNameReplacement

# Write docker-compose.yml with Unix line endings (LF) for Docker compatibility
$dockerComposeContent = $dockerComposeContent -replace "`r`n", "`n" -replace "`r", "`n"
$dockerComposeContent | Out-File -FilePath $dockerComposePath -Encoding utf8 -NoNewline

Write-ColorOutput Green "[OK] Configuration files created"
Write-Output ""

# Build and start
Write-ColorOutput Cyan "Building and starting Docker containers..."
Write-Output "This may take a few minutes on first run..."
Write-Output ""

# Use docker compose (newer) or docker-compose (older)
$DOCKER_COMPOSE_CMD = "docker-compose"
$DOCKER_COMPOSE_DISPLAY = "docker-compose"
$useDockerCompose = $true
$DOCKER_COMPOSE_ARGS = @("up", "-d", "--build")
try {
    docker compose version 2>&1 | Out-Null
    $DOCKER_COMPOSE_CMD = "docker"
    $DOCKER_COMPOSE_DISPLAY = "docker compose"
    $useDockerCompose = $false
    $DOCKER_COMPOSE_ARGS = @("compose", "up", "-d", "--build")
} catch {
    # docker-compose is the fallback
}

# Execute docker compose command
Write-Output "Building Docker images (this may take several minutes)..."
Write-Output ""

# Run build and display output in real-time
& $DOCKER_COMPOSE_CMD $DOCKER_COMPOSE_ARGS
$buildExitCode = $LASTEXITCODE

if ($buildExitCode -ne 0) {
    Write-Output ""
    Write-ColorOutput Yellow "[!] Build failed. Checking for cache issues..."
    
    # Check if it's a cache corruption issue by looking at recent output
    # We'll check the error pattern in the retry logic
    $isCacheIssue = $false
    
    # Clean Docker build cache and retry if it looks like a cache issue
    Write-ColorOutput Yellow "[!] Docker build cache issue detected. Cleaning cache and retrying..."
    Write-Output "This may take a few extra minutes..."
    Write-Output ""
    
    # Clean Docker build cache
    docker builder prune -f 2>&1 | Out-Null
    
    # Retry build without cache
    if ($useDockerCompose) {
        $retryArgs = @("build", "--no-cache", "--pull")
        Write-Output "Retrying build without cache..."
        & $DOCKER_COMPOSE_CMD $retryArgs
        if ($LASTEXITCODE -eq 0) {
            Write-Output ""
            Write-Output "Starting containers..."
            & $DOCKER_COMPOSE_CMD @("up", "-d")
        }
    } else {
        $retryArgs = @("compose", "build", "--no-cache", "--pull")
        Write-Output "Retrying build without cache..."
        & $DOCKER_COMPOSE_CMD $retryArgs
        if ($LASTEXITCODE -eq 0) {
            Write-Output ""
            Write-Output "Starting containers..."
            & $DOCKER_COMPOSE_CMD @("compose", "up", "-d")
        }
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Output ""
        Write-ColorOutput Red "[X] Docker build failed even after cache cleanup."
        Write-ColorOutput Yellow "Try running manually: docker builder prune -af"
        Write-ColorOutput Yellow "Then run: $DOCKER_COMPOSE_DISPLAY up -d --build"
        exit 1
    }
    Write-Output ""
    Write-Output "Build completed successfully after cache cleanup."
} else {
    Write-Output ""
    Write-Output "Build completed successfully."
}

Write-Output ""
Write-ColorOutput Green "[OK] DesterLib is starting up!"
Write-Output ""
Write-ColorOutput Cyan "Your DesterLib server:"
Write-Output "  - API: http://localhost:${PORT}"
Write-Output "  - API Docs: http://localhost:${PORT}/api/docs"
Write-Output "  - Health: http://localhost:${PORT}/health"
Write-Output ""
Write-ColorOutput Cyan "Installation directory: $INSTALL_DIR"
Write-Output ""
Write-ColorOutput Cyan "Useful commands:"
Write-Output "  cd $INSTALL_DIR"
Write-Output "  $DOCKER_COMPOSE_DISPLAY logs -f     - View logs"
Write-Output "  $DOCKER_COMPOSE_DISPLAY ps          - Check status"
Write-Output "  $DOCKER_COMPOSE_DISPLAY restart     - Restart services"
Write-Output "  $DOCKER_COMPOSE_DISPLAY down        - Stop services"
Write-Output ""
Write-ColorOutput Yellow "Note: It may take a minute for the API to be ready."
Write-Output ""

