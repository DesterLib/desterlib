#!/bin/bash
set -e

echo "🚀 Setting up Dester API Development Environment"
echo ""

# Start Docker services
echo "📦 Starting PostgreSQL and Redis..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 3

# Navigate to API directory
cd apps/api

# Copy environment file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local .env.local 2>/dev/null || true
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    pnpm install
fi

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
pnpm prisma generate

# Run migrations
echo "🔄 Running database migrations..."
pnpm prisma migrate dev --name init

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "To start the API:"
echo "  cd apps/api"
echo "  pnpm dev"
echo ""
echo "Useful commands:"
echo "  pnpm prisma studio              # Open Prisma Studio"
echo "  pnpm prisma migrate dev         # Create new migration"
echo "  docker-compose -f docker-compose.dev.yml logs -f  # View DB logs"
echo ""
