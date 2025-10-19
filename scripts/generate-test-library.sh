#!/bin/bash

# Test Library Generator - Convenience Wrapper Script
# This script helps you run the test library generator with proper setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
log() {
  local color=$1
  shift
  echo -e "${color}$*${NC}"
}

# Check if .env file exists and load it
if [ -f .env ]; then
  log "$GREEN" "Loading environment from .env file..."
  export $(cat .env | grep -v '^#' | xargs)
elif [ -f .env.local ]; then
  log "$GREEN" "Loading environment from .env.local file..."
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if TMDB_API_KEY is set
if [ -z "$TMDB_API_KEY" ]; then
  log "$RED" "Error: TMDB_API_KEY not found!"
  echo
  log "$YELLOW" "Please set your TMDB API key in one of these ways:"
  echo
  echo "  1. Create a .env file with:"
  echo "     TMDB_API_KEY=your_api_key_here"
  echo
  echo "  2. Export it in your shell:"
  echo "     export TMDB_API_KEY=your_api_key_here"
  echo
  echo "  3. Pass it when running this script:"
  echo "     TMDB_API_KEY=your_key ./scripts/generate-test-library.sh ..."
  echo
  log "$BLUE" "Get a free TMDB API key at: https://www.themoviedb.org/settings/api"
  exit 1
fi

# Default values
SOURCE_VIDEO="${1:-/Users/alken/Downloads/video.mp4}"
OUTPUT_DIR="${2:-/tmp/dester-test-library}"

# Check if source video exists
if [ ! -f "$SOURCE_VIDEO" ]; then
  log "$RED" "Error: Source video file not found: $SOURCE_VIDEO"
  echo
  log "$YELLOW" "Usage: $0 [source-video] [output-directory]"
  echo "  source-video: Path to video file to clone (default: /Users/alken/Downloads/video.mp4)"
  echo "  output-directory: Where to create test library (default: /tmp/dester-test-library)"
  exit 1
fi

log "$GREEN" "=========================================="
log "$GREEN" "Test Library Generator"
log "$GREEN" "=========================================="
echo
log "$BLUE" "Source video: $SOURCE_VIDEO"
log "$BLUE" "Output directory: $OUTPUT_DIR"
log "$BLUE" "TMDB API Key: ${TMDB_API_KEY:0:8}..."
echo

# Run the Node.js script
log "$GREEN" "Starting generation..."
echo

node scripts/generate-test-library.js "$SOURCE_VIDEO" "$OUTPUT_DIR"

echo
log "$GREEN" "=========================================="
log "$GREEN" "Done!"
log "$GREEN" "=========================================="

