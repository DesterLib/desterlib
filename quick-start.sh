#!/bin/bash
# Quick Start Script for Dester API
set -e

echo "🚀 Dester API Quick Start"
echo ""
echo "Choose an option:"
echo "  1) Development (Local with Docker DB)"
echo "  2) Production (Docker Compose)"
echo ""
read -p "Enter choice [1-2]: " choice

case $choice in
  1)
    echo ""
    echo "📦 Starting Development Environment..."
    ./setup-dev.sh
    ;;
  2)
    echo ""
    echo "📦 Starting Production Environment..."
    
    if [ ! -f .env ]; then
        echo "⚠️  .env file not found!"
        echo "Please copy .env.docker to .env and configure it:"
        echo "  cp .env.docker .env"
        echo "  # Edit .env with your configuration"
        exit 1
    fi
    
    echo "Building and starting services..."
    docker-compose up -d --build
    
    echo ""
    echo "✅ Services started!"
    echo ""
    echo "API: http://localhost:3000"
    echo "API Docs: http://localhost:3000/api-docs"
    echo "Health: http://localhost:3000/health"
    echo ""
    echo "View logs:"
    echo "  docker-compose logs -f api"
    ;;
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac
