#!/bin/sh
set -e

echo "🚀 Starting Dester API..."

# Wait for database to be ready
echo "⏳ Waiting for database..."
until nc -z postgres 5432; do
  echo "Database is unavailable - sleeping"
  sleep 1
done
echo "✅ Database is ready!"

# Run migrations
echo "🔄 Running database migrations..."
pnpm prisma migrate deploy

# Generate Prisma Client (in case it's not already generated)
echo "🔧 Generating Prisma Client..."
pnpm prisma generate

# Start the application
echo "✨ Starting application..."
exec "$@"

