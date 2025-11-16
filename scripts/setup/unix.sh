#!/bin/bash

# DesterLib Quick Setup Script
# Run this script to set up DesterLib without installing anything

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║           🎬 DesterLib Quick Setup                        ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed.${NC}"
    echo -e "${YELLOW}Please install Docker Desktop:${NC}"
    echo -e "${CYAN}  • macOS/Windows: https://www.docker.com/products/docker-desktop${NC}"
    echo -e "${CYAN}  • Linux: https://docs.docker.com/engine/install/${NC}"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running.${NC}"
    echo -e "${YELLOW}Please start Docker Desktop and try again.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed and running${NC}"
echo ""

# Get installation directory
INSTALL_DIR="${HOME}/.desterlib"
echo -e "${CYAN}Installation directory: ${INSTALL_DIR}${NC}"
read -p "Press Enter to use default, or type a different path: " custom_dir
if [ -n "$custom_dir" ]; then
    INSTALL_DIR="$custom_dir"
fi

# Create installation directory
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Get configuration
echo ""
echo -e "${CYAN}📋 Configuration${NC}"
echo ""

# Media library path
read -p "Media library path (where your movies/TV shows are): " MEDIA_PATH
if [ -z "$MEDIA_PATH" ]; then
    echo -e "${RED}❌ Media library path is required${NC}"
    exit 1
fi
if [ ! -d "$MEDIA_PATH" ]; then
    echo -e "${YELLOW}⚠️  Warning: Media path does not exist: $MEDIA_PATH${NC}"
    read -p "Continue anyway? (y/N): " continue_anyway
    if [ "$continue_anyway" != "y" ] && [ "$continue_anyway" != "Y" ]; then
        exit 1
    fi
fi

# Port
read -p "API port [3001]: " PORT
PORT=${PORT:-3001}

# Database credentials
read -p "Database user [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Database password [postgres]: " DB_PASSWORD
DB_PASSWORD=${DB_PASSWORD:-postgres}
echo ""

read -p "Database name [desterlib_prod]: " DB_NAME
DB_NAME=${DB_NAME:-desterlib_prod}

echo ""
echo -e "${CYAN}📦 Setting up DesterLib...${NC}"

# Clone repository if not already there
if [ ! -d ".git" ]; then
    echo "Cloning DesterLib repository..."
    git clone --depth 1 --branch main https://github.com/DesterLib/desterlib.git temp_setup
    # Move files to current directory
    mv temp_setup/* temp_setup/.* . 2>/dev/null || true
    rmdir temp_setup
else
    echo "Updating DesterLib repository..."
    git pull origin main
fi

# Create .env file
echo "Creating .env file..."
cat > apps/api/.env << EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}?schema=public
NODE_ENV=production
PORT=${PORT}
FRONTEND_URL=http://localhost:${PORT}
EOF

# Update docker-compose.yml with user's configuration
echo "Configuring docker-compose.yml..."

# Escape special characters for sed
ESCAPED_MEDIA_PATH=$(echo "$MEDIA_PATH" | sed 's/[[\.*^$()+?{|]/\\&/g')
ESCAPED_DB_PASSWORD=$(echo "$DB_PASSWORD" | sed 's/[[\.*^$()+?{|]/\\&/g')

# Use sed to replace values in docker-compose.yml
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS sed
    sed -i '' "s|- /Volumes/External/Library/Media:/media:ro|- ${ESCAPED_MEDIA_PATH}:/media:ro|" docker-compose.yml
    sed -i '' "s|\"0.0.0.0:3001:3001\"|\"0.0.0.0:${PORT}:${PORT}\"|" docker-compose.yml
    sed -i '' "s|PORT: 3001|PORT: ${PORT}|" docker-compose.yml
    sed -i '' "s|POSTGRES_USER: postgres|POSTGRES_USER: ${DB_USER}|" docker-compose.yml
    sed -i '' "s|POSTGRES_PASSWORD: postgres|POSTGRES_PASSWORD: ${ESCAPED_DB_PASSWORD}|" docker-compose.yml
    sed -i '' "s|POSTGRES_DB: desterlib_prod|POSTGRES_DB: ${DB_NAME}|" docker-compose.yml
    sed -i '' "s|POSTGRES_USER:-postgres|POSTGRES_USER:-${DB_USER}|" docker-compose.yml
    sed -i '' "s|postgres:postgres@postgres|${DB_USER}:${ESCAPED_DB_PASSWORD}@postgres|" docker-compose.yml
    sed -i '' "s|desterlib_prod|${DB_NAME}|g" docker-compose.yml
else
    # Linux sed
    sed -i "s|- /Volumes/External/Library/Media:/media:ro|- ${ESCAPED_MEDIA_PATH}:/media:ro|" docker-compose.yml
    sed -i "s|\"0.0.0.0:3001:3001\"|\"0.0.0.0:${PORT}:${PORT}\"|" docker-compose.yml
    sed -i "s|PORT: 3001|PORT: ${PORT}|" docker-compose.yml
    sed -i "s|POSTGRES_USER: postgres|POSTGRES_USER: ${DB_USER}|" docker-compose.yml
    sed -i "s|POSTGRES_PASSWORD: postgres|POSTGRES_PASSWORD: ${ESCAPED_DB_PASSWORD}|" docker-compose.yml
    sed -i "s|POSTGRES_DB: desterlib_prod|POSTGRES_DB: ${DB_NAME}|" docker-compose.yml
    sed -i "s|POSTGRES_USER:-postgres|POSTGRES_USER:-${DB_USER}|" docker-compose.yml
    sed -i "s|postgres:postgres@postgres|${DB_USER}:${ESCAPED_DB_PASSWORD}@postgres|" docker-compose.yml
    sed -i "s|desterlib_prod|${DB_NAME}|g" docker-compose.yml
fi

echo -e "${GREEN}✅ Configuration files created${NC}"
echo ""

# Build and start
echo -e "${CYAN}🐳 Building and starting Docker containers...${NC}"
echo "This may take a few minutes on first run..."
echo ""

# Use docker compose (newer) or docker-compose (older)
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

$DOCKER_COMPOSE up -d --build

echo ""
echo -e "${GREEN}✅ DesterLib is starting up!${NC}"
echo ""
echo -e "${CYAN}📚 Your DesterLib server:${NC}"
echo -e "  • API: ${GREEN}http://localhost:${PORT}${NC}"
echo -e "  • API Docs: ${GREEN}http://localhost:${PORT}/api/docs${NC}"
echo -e "  • Health: ${GREEN}http://localhost:${PORT}/health${NC}"
echo ""
echo -e "${CYAN}📁 Installation directory: ${INSTALL_DIR}${NC}"
echo ""
echo -e "${CYAN}Useful commands:${NC}"
echo -e "  ${GREEN}cd ${INSTALL_DIR}${NC}"
echo -e "  ${GREEN}$DOCKER_COMPOSE logs -f${NC}     - View logs"
echo -e "  ${GREEN}$DOCKER_COMPOSE ps${NC}          - Check status"
echo -e "  ${GREEN}$DOCKER_COMPOSE restart${NC}     - Restart services"
echo -e "  ${GREEN}$DOCKER_COMPOSE down${NC}        - Stop services"
echo ""
echo -e "${YELLOW}Note: It may take a minute for the API to be ready.${NC}"
echo ""

