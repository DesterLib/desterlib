#!/bin/bash

# DesterLib CLI Installer
# This script installs the DesterLib CLI without requiring Node.js to be pre-installed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║           🎬 DesterLib CLI Installer                      ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Node.js version
check_node_version() {
    if command_exists node; then
        NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_VERSION" -ge 18 ]; then
            return 0
        fi
    fi
    return 1
}

# Function to install Node.js via nvm (recommended)
install_node_via_nvm() {
    echo -e "${YELLOW}📦 Installing Node.js via nvm...${NC}"
    
    if [ ! -d "$HOME/.nvm" ]; then
        echo -e "${CYAN}Installing nvm...${NC}"
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
        
        # Source nvm
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    else
        # Source nvm if it exists
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    fi
    
    # Install latest LTS Node.js
    nvm install --lts
    nvm use --lts
    nvm alias default node
    
    echo -e "${GREEN}✅ Node.js installed successfully${NC}"
}

# Function to install Node.js via package manager
install_node_via_package_manager() {
    OS="$(uname -s)"
    
    case "$OS" in
        Linux*)
            if command_exists apt-get; then
                echo -e "${CYAN}Installing Node.js via apt-get...${NC}"
                curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif command_exists yum; then
                echo -e "${CYAN}Installing Node.js via yum...${NC}"
                curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
                sudo yum install -y nodejs
            elif command_exists dnf; then
                echo -e "${CYAN}Installing Node.js via dnf...${NC}"
                curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
                sudo dnf install -y nodejs
            else
                echo -e "${RED}❌ Could not detect package manager. Please install Node.js manually.${NC}"
                exit 1
            fi
            ;;
        Darwin*)
            if command_exists brew; then
                echo -e "${CYAN}Installing Node.js via Homebrew...${NC}"
                brew install node
            else
                echo -e "${YELLOW}⚠️  Homebrew not found. Please install Node.js from:${NC}"
                echo -e "${CYAN}   https://nodejs.org/${NC}"
                exit 1
            fi
            ;;
        *)
            echo -e "${RED}❌ Unsupported operating system: $OS${NC}"
            echo -e "${YELLOW}Please install Node.js manually from: https://nodejs.org/${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✅ Node.js installed successfully${NC}"
}

# Check if Node.js is installed
if ! check_node_version; then
    echo -e "${YELLOW}⚠️  Node.js 18+ is required but not found.${NC}"
    echo ""
    echo -e "${CYAN}Choose installation method:${NC}"
    echo -e "  1) Install via nvm (recommended, user-level)"
    echo -e "  2) Install via system package manager (requires sudo)"
    echo -e "  3) Install manually (exit and install from https://nodejs.org/)"
    echo ""
    read -p "Enter choice [1-3]: " choice
    
    case $choice in
        1)
            install_node_via_nvm
            ;;
        2)
            install_node_via_package_manager
            ;;
        3)
            echo -e "${YELLOW}Please install Node.js 18+ and run this script again.${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice. Exiting.${NC}"
            exit 1
            ;;
    esac
fi

# Verify Node.js installation
if ! check_node_version; then
    echo -e "${RED}❌ Node.js 18+ is still not available.${NC}"
    echo -e "${YELLOW}Please restart your terminal and try again, or install Node.js manually.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ Node.js $NODE_VERSION and npm $NPM_VERSION detected${NC}"

# Check if git is available
if ! command_exists git; then
    echo -e "${RED}❌ Git is required but not found.${NC}"
    echo -e "${YELLOW}Please install Git and run this script again.${NC}"
    echo -e "${CYAN}   https://git-scm.com/downloads${NC}"
    exit 1
fi

# Install CLI globally from GitHub
echo ""
echo -e "${CYAN}📦 Installing DesterLib CLI from GitHub...${NC}"

# Create temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Clone repository
echo -e "${CYAN}Cloning repository...${NC}"
if ! git clone --depth 1 --branch main https://github.com/DesterLib/desterlib.git "$TEMP_DIR/desterlib"; then
    echo -e "${RED}❌ Failed to clone repository.${NC}"
    exit 1
fi

# Navigate to CLI package and install
cd "$TEMP_DIR/desterlib/packages/cli"

# Install dependencies and build
echo -e "${CYAN}Building CLI...${NC}"
if ! npm install; then
    echo -e "${RED}❌ Failed to install dependencies.${NC}"
    exit 1
fi

if ! npm run build; then
    echo -e "${RED}❌ Failed to build CLI.${NC}"
    exit 1
fi

# Install globally
echo -e "${CYAN}Installing CLI globally...${NC}"

# Try installing without sudo first
NPM_LOG=$(mktemp)
set +e  # Temporarily disable exit on error
npm install -g . > "$NPM_LOG" 2>&1
NPM_EXIT_CODE=$?
set -e  # Re-enable exit on error

if [ $NPM_EXIT_CODE -eq 0 ]; then
    # Installation succeeded
    :
else
    # Show the error
    cat "$NPM_LOG"
    # Check if the error was due to permissions
    if grep -q "EACCES\|permission denied" "$NPM_LOG" 2>/dev/null; then
        echo ""
        echo -e "${YELLOW}⚠️  Permission denied. Trying with sudo...${NC}"
        echo -e "${CYAN}You may be prompted for your password.${NC}"
        set +e  # Temporarily disable exit on error
        sudo npm install -g .
        SUDO_EXIT_CODE=$?
        set -e  # Re-enable exit on error
        
        if [ $SUDO_EXIT_CODE -eq 0 ]; then
            # Installation succeeded with sudo
            :
        else
            echo -e "${RED}❌ Failed to install CLI globally even with sudo.${NC}"
            echo ""
            echo -e "${YELLOW}Alternative installation methods:${NC}"
            echo -e "  1. Configure npm to use a different directory (no sudo needed):"
            echo -e "     ${CYAN}mkdir -p ~/.npm-global${NC}"
            echo -e "     ${CYAN}npm config set prefix '~/.npm-global'${NC}"
            echo -e "     ${CYAN}echo 'export PATH=~/.npm-global/bin:\$PATH' >> ~/.zshrc${NC}"
            echo -e "     ${CYAN}source ~/.zshrc${NC}"
            echo -e "     Then run this installer again."
            echo ""
            echo -e "  2. Or install manually:"
            echo -e "     ${CYAN}cd $TEMP_DIR/desterlib/packages/cli${NC}"
            echo -e "     ${CYAN}sudo npm install -g .${NC}"
            rm -f "$NPM_LOG"
            exit 1
        fi
    else
        echo -e "${RED}❌ Failed to install CLI globally.${NC}"
        echo -e "${YELLOW}Check the error message above for details.${NC}"
        rm -f "$NPM_LOG"
        exit 1
    fi
fi
rm -f "$NPM_LOG"

# Verify installation
if command_exists desterlib; then
    echo ""
    echo -e "${GREEN}✅ DesterLib CLI installed successfully!${NC}"
    echo ""
    echo -e "${CYAN}You can now run:${NC}"
    echo -e "  ${GREEN}desterlib${NC}        - Run the setup wizard"
    echo -e "  ${GREEN}desterlib setup${NC}  - Run the setup wizard"
    echo ""
    echo -e "${CYAN}To update the CLI in the future, run this installer again.${NC}"
    echo ""
else
    echo -e "${RED}❌ Installation completed but 'desterlib' command not found.${NC}"
    echo -e "${YELLOW}Please check your PATH or restart your terminal.${NC}"
    exit 1
fi

