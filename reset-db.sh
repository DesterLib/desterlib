#!/bin/bash
# Reset Database Script
set -e

echo "⚠️  WARNING: This will delete all data in the database!"
read -p "Are you sure you want to reset the database? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo ""
echo "🗑️  Resetting database..."

cd apps/api

# Drop and recreate database
echo "Dropping existing migrations..."
rm -rf prisma/migrations

echo "Stopping Docker services..."
docker-compose -f ../../docker-compose.dev.yml down -v

echo "Starting fresh database..."
docker-compose -f ../../docker-compose.dev.yml up -d

echo "Waiting for PostgreSQL..."
sleep 3

echo "Creating new migration..."
pnpm prisma migrate dev --name init

echo ""
echo "✅ Database reset complete!"
echo ""
echo "To add test data, create a seed script: apps/api/prisma/seed.ts"
