FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ wget

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY turbo.json ./

# Copy all packages (needed for workspace dependencies)
COPY packages ./packages

# Copy API source code
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
# Set a dummy DATABASE_URL for prisma generate (doesn't need real connection)
WORKDIR /app/apps/api
RUN DATABASE_URL="file:./dummy.db" pnpm exec prisma generate

# Build the API
WORKDIR /app
RUN pnpm build --filter=api

# Create startup script for database initialization
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
set -e

echo "=== DesterLib API Container Startup ==="

# Ensure database directory exists (for SQLite)
if [ -n "$DATABASE_URL" ]; then
  # Extract path from file: URL if present
  DB_PATH=$(echo "$DATABASE_URL" | sed 's|^file:||')
  DB_DIR=$(dirname "$DB_PATH")
  if [ "$DB_DIR" != "." ] && [ "$DB_DIR" != "/" ]; then
    echo "Creating database directory: $DB_DIR"
    mkdir -p "$DB_DIR"
  fi
fi

# Push database schema (SQLite - no connection check needed)
cd /app/apps/api
echo "Running Prisma database push..."
pnpm exec prisma db push --accept-data-loss

# Start the application
cd /app/apps/api
echo "Starting application..."
echo "Current working directory: $(pwd)"

echo "Starting DesterLib API server on port ${PORT:-3001}..."
pnpm start
EOF

RUN chmod +x /app/start.sh

# Expose port
EXPOSE 3001

# Default command (production)
CMD ["/app/start.sh"]

