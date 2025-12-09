#!/bin/bash
set -e

echo "=== Testing DesterLib Docker Setup ==="
echo ""

# Navigate to docker directory
cd "$(dirname "$0")"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker daemon is not running. Please start Docker Desktop first."
    exit 1
fi

echo "✅ Docker daemon is running"
echo ""

# Stop any existing containers
echo "🧹 Cleaning up any existing containers..."
docker-compose down -v 2>/dev/null || true
echo ""

# Build images
echo "🔨 Building Docker images..."
echo "This may take a few minutes on first run..."
docker-compose build --no-cache
echo ""

# Start services
echo "🚀 Starting services..."
docker-compose up -d
echo ""

# Wait a bit for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10
echo ""

# Check service status
echo "📊 Service Status:"
docker-compose ps
echo ""

# Check logs
echo "📋 Recent logs from all services:"
docker-compose logs --tail=50
echo ""

# Test health endpoints
echo "🏥 Testing health endpoints..."
echo ""

echo "Testing Redis..."
if docker-compose exec -T redis redis-cli ping | grep -q PONG; then
    echo "✅ Redis is healthy"
else
    echo "❌ Redis health check failed"
fi
echo ""

echo "Testing API service..."
if curl -f -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API service is healthy"
    curl -s http://localhost:3001/health
    echo ""
else
    echo "❌ API service health check failed"
    echo "Checking API logs..."
    docker-compose logs api --tail=20
fi
echo ""

echo "Testing Scanner service..."
if curl -f -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Scanner service is healthy"
    curl -s http://localhost:8080/health
    echo ""
else
    echo "❌ Scanner service health check failed"
    echo "Checking scanner logs..."
    docker-compose logs scanner-service --tail=20
fi
echo ""

echo "=== Test Complete ==="
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"
echo "To restart: docker-compose restart"

