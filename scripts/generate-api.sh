#!/bin/bash

# Script to generate API client from OpenAPI spec
# Checks if API is running first

set -e

echo "🔍 Checking if API server is running..."

# Check if API is accessible
if ! curl -sf http://localhost:3000/health > /dev/null; then
  echo "❌ API server is not running on http://localhost:3000"
  echo ""
  echo "Please start the API server first:"
  echo "  pnpm --filter api dev"
  echo ""
  echo "Then run this script again."
  exit 1
fi

echo "✅ API server is running"
echo ""
echo "🔄 Generating API client from OpenAPI spec..."

# Run orval
pnpm orval --config orval.config.ts

echo ""
echo "✨ API client generated successfully!"
echo "   Check packages/api-client/src/generated/"

